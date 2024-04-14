import { Event } from '../../types/events'
import prisma from 'src/clients/prisma'
import { OrderType } from '@prisma/client'
import parseOrder from '../../parsers/clmm/parseOrder'

const handleOrderClaimed = async (event: Event) => {
  const params = parseOrder(event.body)
  console.log('OrderClaimed event is indexed.')
  console.log(event)

  const order = await prisma.order.findFirst({
    where: {
      poolAddress: params.poolAddress,
      ownerAddress: params.senderAddress,
      positionAddress: params.positionAddress,
      positionId: params.positionId,
      binId: params.binId,
    },
  })

  if (order) {
    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: OrderType.CLAIMED,
      },
    })
  } else {
    // error
  }

  await prisma.orderHistory.create({
    data: {
      id: event.transaction.hash,
      eventId: event.transaction.eventId,
      amountX: params.amountX.toString(),
      amountY: params.amountY.toString(),
      senderAddress: params.senderAddress,
      poolAddress: params.poolAddress,
      positionAddress: params.positionAddress,
      positionId: params.positionId,
      orderForY: params.orderForY,
      binId: params.binId,
      timestamp: event.transaction.timestamp,
      orderType: OrderType.CLAIMED,
    },
  })
}

export default handleOrderClaimed
