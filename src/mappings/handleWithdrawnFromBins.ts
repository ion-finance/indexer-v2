import { Event } from "../types/events";
import prisma from "../clients/prisma";
import { Prisma } from "@prisma/client";
import parseWithdrawnFromBins from "../parsers/parseWithdrawnFromBins";

const handleWithdrawnFromBins = async (
  event: Event<ReturnType<typeof parseWithdrawnFromBins>>
) => {
  console.log("WithdrawnFromBins event is indexed.");
  console.log(event);

  const withdrawnArray = event.params.withdrawn.keys().map((key) => {
    return {
      binId: key,
      amountX: event.params.withdrawn.get(key)?.amountX.toString() || "0",
      amount: event.params.withdrawn.get(key)?.amountY.toString() || "0",
    };
  });

  await prisma.withdrawnFromBins.upsert({
    where: {
      id: event.transaction.hash,
    },
    update: {
      timestamp: event.transaction.timestamp,
      poolAddress: event.transaction.source,
      senderAddress: event.params.senderAddress,
      receiverAddress: event.params.receiverAddress,
    },
    create: {
      id: event.transaction.hash,
      timestamp: event.transaction.timestamp,
      poolAddress: event.transaction.source,
      senderAddress: event.params.senderAddress,
      receiverAddress: event.params.receiverAddress,
      withdrawn: withdrawnArray as Prisma.JsonArray,
    },
  });

  const bins = await prisma.bins.findMany({
    where: {
      binId: {
        in: withdrawnArray.map((withdrawn) => withdrawn.binId),
      },
      poolAddress: {
        equals: event.transaction.source,
      },
    },
  });

  await Promise.all(
    withdrawnArray.map(async (withdrawn) => {
      const bin = bins.find((bin) => bin.binId === withdrawn.binId);

      if (bin) {
        return prisma.bins.updateMany({
          where: {
            binId: withdrawn.binId,
            poolAddress: event.transaction.source,
          },
          data: {
            reserveX: (
              BigInt(bin.reserveX) - BigInt(withdrawn.amountX)
            ).toString(),
            reserveY: (
              BigInt(bin.reserveY) - BigInt(withdrawn.amount)
            ).toString(),
          },
        });
      }
    })
  );
};

export default handleWithdrawnFromBins;
