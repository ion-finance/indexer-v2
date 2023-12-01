import { Event, DepositedToBinsParams } from "../types/events";
import prisma from "../clients/prisma";
import { Prisma } from "@prisma/client";

export const handleDepositedToBins = async (
  event: Event<DepositedToBinsParams>
) => {
  console.log("DepositedToBins event is indexed.");
  console.log(event);

  const depositedArray = event.params.deposited.keys().map((key) => {
    return {
      binId: key.toString(),
      amount: event.params.deposited.get(key)?.amount.toString() || "0",
    };
  });

  await prisma.depositedToBins.upsert({
    where: {
      id: event.transaction.hash,
    },
    update: {
      timestamp: event.transaction.timestamp,
      poolAddress: event.transaction.source,
      senderAddress: event.params.senderAddress,
      receiverAddress: event.params.receiverAddress,
      tokenAddress: event.params.tokenAddress,
    },
    create: {
      id: event.transaction.hash,
      timestamp: event.transaction.timestamp,
      poolAddress: event.transaction.source,
      senderAddress: event.params.senderAddress,
      receiverAddress: event.params.receiverAddress,
      tokenAddress: event.params.tokenAddress,
      deposited: depositedArray as Prisma.JsonArray,
    },
  });

  const bins = await prisma.bins.findMany({
    where: {
      id: {
        in: depositedArray.map((deposited) => deposited.binId),
      },
    },
  });

  await Promise.all(
    depositedArray.map(async (deposited) => {
      const bin = bins.find((bin) => bin.id === deposited.binId);

      if (bin) {
        return prisma.bins.update({
          where: {
            id: deposited.binId,
          },
          data: {
            reserve: (
              BigInt(bin.reserve) + BigInt(deposited.amount)
            ).toString(),
          },
        });
      } else {
        return prisma.bins.create({
          data: {
            id: deposited.binId,
            poolAddress: event.transaction.source,
            tokenAddress: event.params.tokenAddress,
            reserve: deposited.amount.toString(),
          },
        });
      }
    })
  );
};