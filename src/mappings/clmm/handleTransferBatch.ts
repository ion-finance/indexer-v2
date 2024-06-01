import { Prisma } from '@prisma/client'
import _ from 'lodash'

import prisma from 'src/clients/prisma'

import parseTransferBatch from '../../parsers/clmm/parseTransferBatch'
import { Event } from '../../types/events'

const handleTransferBatch = async (event: Event) => {
  const params = parseTransferBatch(event.body)

  const amountArray = params.amounts.keys().map((key) => {
    return {
      binId: key,
      amount: params.amounts.get(key)?.amount.toString() || '0',
    }
  })

  await prisma.transferBatch.create({
    data: {
      id: event.transaction.hash,
      eventId: event.transaction.eventId,
      timestamp: event.transaction.timestamp,
      poolAddress: event.transaction.source,
      senderAddress: params.senderAddress,
      fromAddress: params.fromAddress,
      toAddress: params.toAddress,
      amounts: amountArray as Prisma.JsonArray,
    },
  })

  const lpTokenWalletFrom = await prisma.lpTokenWallet.findFirst({
    where: {
      poolAddress: event.transaction.source,
      ownerAddress: params.fromAddress,
    },
  })

  if (lpTokenWalletFrom) {
    await prisma.lpTokenWallet.update({
      where: {
        id: lpTokenWalletFrom.id,
      },
      data: {
        shares: (lpTokenWalletFrom.shares as Prisma.JsonArray).map((share) => {
          const typedShare = share as { binId: number; amount: string }

          const updated = amountArray.find(
            (item) => item.binId === typedShare.binId,
          )

          if (updated) {
            return {
              binId: typedShare.binId,
              amount: (
                BigInt(typedShare.amount) - BigInt(updated.amount)
              ).toString(),
            }
          }

          return typedShare
        }) as Prisma.JsonArray,
      },
    })
  }

  if (params.toAddress === event.transaction.source) {
    return
  }

  const lpTokenWalletTo = await prisma.lpTokenWallet.findFirst({
    where: {
      poolAddress: event.transaction.source,
      ownerAddress: params.toAddress,
    },
  })

  if (lpTokenWalletTo) {
    const sharesGroupByBinId = _.groupBy(
      [...(lpTokenWalletTo.shares as Prisma.JsonArray), ...amountArray],
      'binId',
    )

    const shares = Object.keys(sharesGroupByBinId).map((key) => {
      const items = sharesGroupByBinId[key]

      return {
        binId: Number(key),
        amount: items
          .reduce((acc, item) => {
            const typedItem = item as { binId: number; amount: string }

            return acc + BigInt(typedItem.amount || '0')
          }, BigInt(0))
          .toString(),
      }
    })

    await prisma.lpTokenWallet.update({
      where: {
        id: lpTokenWalletTo.id,
      },
      data: {
        shares: shares as Prisma.JsonArray,
      },
    })
  } else {
    await prisma.lpTokenWallet.create({
      data: {
        poolAddress: event.transaction.source,
        ownerAddress: params.toAddress,
        shares: amountArray as Prisma.JsonArray,
        timestamp: new Date(event.transaction.timestamp),
      },
    })
  }
}

export default handleTransferBatch
