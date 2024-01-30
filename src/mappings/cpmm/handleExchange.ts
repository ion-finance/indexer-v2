import { Event } from "../../types/events";
import prisma from "../../clients/prisma";
import parseExchange from "../../parsers/cpmm/parseExchange";

export const handleExchange = async (event: Event) => {
  const params = parseExchange(event.body);
  console.log("Exchange event is indexed.");
  console.log(event);

  // i -> j swap, j == 1 means swap for y
  const isSwapForY = params.j === 1;

  await prisma.swap.upsert({
    where: {
      id: event.transaction.hash,
      eventId: event.transaction.eventId,
    },
    update: {
      timestamp: event.transaction.timestamp,
      poolAddress: event.transaction.source,
      senderAddress: params.from,
      receiverAddress: params.to,
      amountIn: params.amountI.toString(),
      amountOut: params.amountJ.toString(),
      swapForY: isSwapForY,
    },
    create: {
      id: event.transaction.hash,
      eventId: event.transaction.eventId,
      timestamp: event.transaction.timestamp,
      poolAddress: event.transaction.source,
      senderAddress: params.from,
      receiverAddress: params.to,
      amountIn: params.amountI.toString(),
      amountOut: params.amountJ.toString(),
      swapForY: isSwapForY,
    },
  });
};

export default handleExchange;
