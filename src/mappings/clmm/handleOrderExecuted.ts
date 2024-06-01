import { OrderType } from '@prisma/client'

import prisma from 'src/clients/prisma'

import parseOrder from '../../parsers/clmm/parseOrder'
import { Event } from '../../types/events'

const handleOrderExecuted = async (event: Event) => {
  const params = parseOrder(event.body)

  const orders = await prisma.order.findMany({
    where: {
      poolAddress: params.poolAddress,
      positionId: params.positionId,
      binId: params.binId,
    },
  })

  await prisma.orderHistory.updateMany({
    where: {
      id: {
        in: orders.map((order) => order.id),
      },
    },
    data: {
      orderType: OrderType.EXECUTED,
    },
  })

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
      relatedOwnerAddres: orders.map((order) => order.ownerAddress).join(','),
    },
  })
}

export default handleOrderExecuted
