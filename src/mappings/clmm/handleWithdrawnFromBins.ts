import prisma from 'src/clients/prisma'

import parseWithdrawnFromBins from '../../parsers/clmm/parseWithdrawnFromBins'
import { Event } from '../../types/events'

const handleWithdrawnFromBins = async (event: Event) => {
  const params = parseWithdrawnFromBins(event.body)
  console.log('WithdrawnFromBins event is indexed.')
  // console.log(event)

  const withdrawnArray = params.withdrawn.keys().map((key) => {
    return {
      binId: key,
      amountX: params.withdrawn.get(key)?.amountX.toString() || '0',
      amountY: params.withdrawn.get(key)?.amountY.toString() || '0',
    }
  })

  await prisma.withdraw.upsert({
    where: {
      id: event.transaction.hash,
    },
    update: {
      timestamp: new Date(event.transaction.timestamp),
      poolAddress: event.transaction.source,
      senderAddress: params.senderAddress,
      receiverAddress: params.receiverAddress,
    },
    create: {
      id: event.transaction.hash,
      // eventId: event.transaction.eventId,
      hash: event.transaction.eventId,
      timestamp: new Date(event.transaction.timestamp),
      poolAddress: event.transaction.source,
      senderAddress: params.senderAddress,
      receiverAddress: params.receiverAddress,
      amountX: withdrawnArray
        .reduce((res, cur) => {
          return res + BigInt(cur.amountX)
        }, BigInt(0))
        .toString(),
      amountY: withdrawnArray
        .reduce((res, cur) => {
          return res + BigInt(cur.amountY)
        }, BigInt(0))
        .toString(),
    },
  })

  const bins = await prisma.bins.findMany({
    where: {
      binId: {
        in: withdrawnArray.map((withdrawn) => withdrawn.binId),
      },
      poolAddress: {
        equals: event.transaction.source,
      },
    },
  })

  await Promise.all(
    withdrawnArray.map(async (withdrawn) => {
      const bin = bins.find((bin) => bin.binId === withdrawn.binId)

      if (bin) {
        return prisma.bins.updateMany({
          where: {
            binId: withdrawn.binId,
            poolAddress: event.transaction.source,
          },
          data: {
            reserveX: (
              BigInt(bin.reserveX) - BigInt(withdrawn.amountX)
            ).toString(),
            reserveY: (
              BigInt(bin.reserveY) - BigInt(withdrawn.amountY)
            ).toString(),
          },
        })
      }
    }),
  )
}

export default handleWithdrawnFromBins
