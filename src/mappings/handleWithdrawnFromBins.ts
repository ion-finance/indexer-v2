import { Event } from "../types/events";
import prisma from "../clients/prisma";
import { Prisma } from "@prisma/client";
import parseWithdrawnFromBins from "../parsers/parseWithdrawnFromBins";

const handleWithdrawnFromBins = async (event: Event) => {
  const params = parseWithdrawnFromBins(event.body);
  console.log("WithdrawnFromBins event is indexed.");
  console.log(event);

  const withdrawnArray = params.withdrawn.keys().map((key) => {
    return {
      binId: key,
      amountX: params.withdrawn.get(key)?.amountX.toString() || "0",
      amountY: params.withdrawn.get(key)?.amountY.toString() || "0",
    };
  });

  await prisma.withdrawnFromBins.upsert({
    where: {
      id: event.transaction.hash,
    },
    update: {
      timestamp: event.transaction.timestamp,
      poolAddress: event.transaction.source,
      senderAddress: params.senderAddress,
      receiverAddress: params.receiverAddress,
    },
    create: {
      id: event.transaction.hash,
      eventId: event.transaction.eventId,
      timestamp: event.transaction.timestamp,
      poolAddress: event.transaction.source,
      senderAddress: params.senderAddress,
      receiverAddress: params.receiverAddress,
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
              BigInt(bin.reserveY) - BigInt(withdrawn.amountY)
            ).toString(),
          },
        });
      }
    })
  );
};

export default handleWithdrawnFromBins;
