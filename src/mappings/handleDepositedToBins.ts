import { Event } from "../types/events";
import prisma from "../clients/prisma";
import parseDepositedToBins from "../parsers/parseDepositedToBins";

const handleDepositedToBins = async (event: Event) => {
  const params = parseDepositedToBins(event.body);
  console.log("DepositedToBins event is indexed.");
  console.log(event);

  const pool = await prisma.pool.findFirst({
    where: {
      id: event.transaction.source,
    },
  });

  if (!pool) {
    console.log("Pool not found.");
    return;
  }

  const isX = params.tokenAddress === pool?.tokenXAddress;

  const depositedArray = params.deposited.keys().map((key) => {
    return {
      binId: key,
      amount: params.deposited.get(key)?.amount.toString() || "0",
    };
  });

  await prisma.deposit.upsert({
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
      eventId: event.transaction.eventId,
      timestamp: event.transaction.timestamp,
      poolAddress: event.transaction.source,
      senderAddress: params.senderAddress,
      receiverAddress: params.receiverAddress,
      tokenAddress: params.tokenAddress,
      amountX: isX
        ? depositedArray
            .reduce((res, cur) => res + BigInt(cur.amount), BigInt(0))
            .toString()
        : "0",
      amountY: !isX
        ? depositedArray
            .reduce((res, cur) => res + BigInt(cur.amount), BigInt(0))
            .toString()
        : "0",
    },
  });

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
