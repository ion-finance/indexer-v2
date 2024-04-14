import { Event } from '../../types/events'
import prisma from 'src/clients/prisma'
import parseSwap from '../../parsers/clmm/parseSwap'

const handleSwap = async (event: Event) => {
  const params = parseSwap(event.body)
  console.log('Swap event is indexed.')
  console.log(event)

  await prisma.swap.upsert({
    where: {
      id: event.transaction.hash,
    },
    update: {
      timestamp: event.transaction.timestamp,
      poolAddress: event.transaction.source,
      senderAddress: params.senderAddress,
      receiverAddress: params.receiverAddress,
      amountIn: params.amountIn.toString(),
      amountOut: params.amountOut.toString(),
      swapForY: params.swapForY,
      activeBinId: params.activeBinId,
    },
    create: {
      id: event.transaction.hash,
      eventId: event.transaction.eventId,
      timestamp: event.transaction.timestamp,
      poolAddress: event.transaction.source,
      senderAddress: params.senderAddress,
      receiverAddress: params.receiverAddress,
      amountIn: params.amountIn.toString(),
      amountOut: params.amountOut.toString(),
      swapForY: params.swapForY,
      activeBinId: params.activeBinId,
    },
  })

  const pool = await prisma.pool.findFirst({
    where: {
      id: event.transaction.source,
    },
  })

  if (pool) {
    await prisma.pool.update({
      where: {
        id: event.transaction.source,
      },
      data: {
        activeBinId: params.activeBinId,
      },
    })
  }
}

export default handleSwap
