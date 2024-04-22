import { OrderType } from '@prisma/client'

import prisma from 'src/clients/prisma'

import parseOrder from '../../parsers/clmm/parseOrder'
import { Event } from '../../types/events'

const handleOrderPlaced = async (event: Event) => {
  const params = parseOrder(event.body)
  console.log('OrderPlaced event is indexed.')
  // console.log(event)

  const order = await prisma.order.findFirst({
    where: {
      ownerAddress: params.senderAddress,
      poolAddress: params.poolAddress,
      positionId: params.positionId,
      positionAddress: params.positionAddress,
      binId: params.binId,
      status: OrderType.PLACED,
    },
  })

  if (order) {
    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        amountX: (BigInt(order.amountX) + params.amountX).toString(),
        amountY: (BigInt(order.amountY) + params.amountY).toString(),
      },
    })
  } else {
    await prisma.order.create({
      data: {
        amountX: params.amountX.toString(),
        amountY: params.amountY.toString(),
        ownerAddress: params.senderAddress,
        poolAddress: params.poolAddress,
        positionId: params.positionId,
        positionAddress: params.positionAddress,
        binId: params.binId,
        timestamp: event.transaction.timestamp,
        status: OrderType.PLACED,
        orderForY: params.orderForY,
      },
    })
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
      orderType: OrderType.PLACED,
    },
  })
}

export default handleOrderPlaced
