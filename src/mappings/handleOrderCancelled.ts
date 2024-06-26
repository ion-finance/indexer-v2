import { Event } from "../types/events";
import prisma from "../clients/prisma";
import { OrderType } from "@prisma/client";
import parseOrder from "../parsers/parseOrder";

const handleOrderCancelled = async (event: Event) => {
  const params = parseOrder(event.body);
  console.log("OrderCancelled event is indexed.");
  console.log(event);

  const order = await prisma.order.findFirst({
    where: {
      poolAddress: params.poolAddress,
      positionAddress: params.positionAddress,
      ownerAddress: params.senderAddress,
      positionId: params.positionId,
      binId: params.binId,
    },
  });

  if (order) {
    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: OrderType.CANCELLED,
      },
    });
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
      orderType: OrderType.CANCELLED,
    },
  });
};

export default handleOrderCancelled;
