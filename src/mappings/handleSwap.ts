import { Event } from "../types/events";
import prisma from "../clients/prisma";
import parseSwap from "../parsers/parseSwap";

export const handleSwap = async (
  event: Event<ReturnType<typeof parseSwap>>
) => {
  console.log("Swap event is indexed.");
  console.log(event);

  await prisma.swap.upsert({
    where: {
      id: event.transaction.hash,
    },
    update: {
      timestamp: event.transaction.timestamp,
      poolAddress: event.transaction.source,
      senderAddress: event.params.senderAddress,
      receiverAddress: event.params.receiverAddress,
      amountIn: event.params.amountIn.toString(),
      amountOut: event.params.amountOut.toString(),
      swapForY: event.params.swapForY,
      activeBinId: event.params.activeBinId,
    },
    create: {
      id: event.transaction.hash,
      timestamp: event.transaction.timestamp,
      poolAddress: event.transaction.source,
      senderAddress: event.params.senderAddress,
      receiverAddress: event.params.receiverAddress,
      amountIn: event.params.amountIn.toString(),
      amountOut: event.params.amountOut.toString(),
      swapForY: event.params.swapForY,
      activeBinId: event.params.activeBinId,
    },
  });

  const pool = await prisma.pool.findFirst({
    where: {
      id: event.transaction.source,
    },
  });

  if (pool) {
    await prisma.pool.update({
      where: {
        id: event.transaction.source,
      },
      data: {
        activeBinId: event.params.activeBinId,
      },
    });
  }
};
