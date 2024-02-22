import { Event } from "../../types/events";
import prisma from "../../clients/prisma";
import parseExchange from "../../parsers/cpmm/parseExchange";

export const handleExchange = async (event: Event) => {
  const params = parseExchange(event.body);
  console.log("Exchange event is indexed.");
  console.log(params);

  const pool = await prisma.pool.findFirst({
    where: {
      id: event.transaction.source,
    },
  });

  if (!pool) {
    console.log("Pool not found.");
    return;
  }

  await prisma.swap.upsert({
    where: {
      id: event.transaction.hash,
      eventId: event.transaction.eventId,
    },
    update: {
      timestamp: event.transaction.timestamp,
      poolAddress: event.transaction.source,
      senderAddress: params.senderAddress,
      receiverAddress: params.receiverAddress,
      amountIn: params.amountIn.toString(),
      amountOut: params.amountOut.toString(),
      swapForY: params.swapForY,
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
    },
  });

  // swapForY true
  // reserveX = reserveX + amountIn
  // reserveY = reserveY - amountOut

  // swapForY false
  // reserveX = reserveX - amountOut
  // reserveY = reserveY + amountIn

  let reserveX = BigInt(pool.reserveX);
  let reserveY = BigInt(pool.reserveY);

  if (params.swapForY) {
    reserveX = reserveX + BigInt(params.amountIn);
    reserveY = reserveY - BigInt(params.amountOut);
  } else {
    reserveX = reserveX - BigInt(params.amountOut);
    reserveY = reserveY + BigInt(params.amountIn);
  }

  await prisma.pool.update({
    where: {
      id: pool.id,
    },
    data: {
      reserveX: reserveX.toString(),
      reserveY: reserveY.toString(),
    },
  });
};

export default handleExchange;
