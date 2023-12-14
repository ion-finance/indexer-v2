import { Event } from "../types/events";
import prisma from "../clients/prisma";
import { Prisma } from "@prisma/client";
import parseDepositedToBins from "../parsers/parseDepositedToBins";

const handleDepositedToBins = async (event: Event) => {
  const params = parseDepositedToBins(event.body);
  console.log("DepositedToBins event is indexed.");
  console.log(event);

  const depositedArray = params.deposited.keys().map((key) => {
    return {
      binId: key,
      amount: params.deposited.get(key)?.amount.toString() || "0",
    };
  });

  await prisma.depositedToBins.upsert({
    where: {
      id: event.transaction.hash,
    },
    update: {
      timestamp: event.transaction.timestamp,
      poolAddress: event.transaction.source,
      senderAddress: params.senderAddress,
      receiverAddress: params.receiverAddress,
      tokenAddress: params.tokenAddress,
    },
    create: {
      id: event.transaction.hash,
      timestamp: event.transaction.timestamp,
      poolAddress: event.transaction.source,
      senderAddress: params.senderAddress,
      receiverAddress: params.receiverAddress,
      tokenAddress: params.tokenAddress,
      deposited: depositedArray as Prisma.JsonArray,
    },
  });

  const pool = await prisma.pool.findFirst({
    where: {
      id: event.transaction.source,
    },
  });

  if (!pool) {
    return;
  }

  const bins = await prisma.bins.findMany({
    where: {
      binId: {
        in: depositedArray.map((deposited) => deposited.binId),
      },
      poolAddress: {
        equals: event.transaction.source,
      },
    },
  });

  await Promise.all(
    depositedArray.map(async (deposited) => {
      const bin = bins.find((bin) => bin.binId === deposited.binId);
      const isX = params.tokenAddress === pool?.tokenXAddress;

      if (bin) {
        return prisma.bins.updateMany({
          where: {
            binId: deposited.binId,
            poolAddress: event.transaction.source,
          },
          data: {
            reserveX: (
              BigInt(bin.reserveX) +
              (isX ? BigInt(deposited.amount) : BigInt(0))
            ).toString(),
            reserveY: (
              BigInt(bin.reserveY) +
              (isX ? BigInt(0) : BigInt(deposited.amount))
            ).toString(),
          },
        });
      } else {
        return prisma.bins.create({
          data: {
            binId: Number(deposited.binId),
            poolAddress: event.transaction.source,
            reserveX: (isX ? BigInt(deposited.amount) : BigInt(0)).toString(),
            reserveY: (isX ? BigInt(0) : BigInt(deposited.amount)).toString(),
          },
        });
      }
    })
  );
};

export default handleDepositedToBins;
