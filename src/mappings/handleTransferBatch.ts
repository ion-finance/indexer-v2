import { Event } from "../types/events";
import prisma from "../clients/prisma";
import { Prisma } from "@prisma/client";
import parseTransferBatch from "../parsers/parseTransferBatch";
import _ from "lodash";

export const handleTransferBatch = async (
  event: Event<ReturnType<typeof parseTransferBatch>>
) => {
  console.log("TransferBatch event is indexed.");
  console.log(event);

  const amountArray = event.params.amounts.keys().map((key) => {
    return {
      binId: key,
      amount: event.params.amounts.get(key)?.amount.toString() || "0",
    };
  });

  await prisma.transferBatch.create({
    data: {
      id: event.transaction.hash,
      timestamp: event.transaction.timestamp,
      poolAddress: event.transaction.source,
      senderAddress: event.params.senderAddress,
      fromAddress: event.params.fromAddress,
      toAddress: event.params.toAddress,
      amounts: amountArray as Prisma.JsonArray,
    },
  });

  const lpTokenWalletFrom = await prisma.lpTokenWallet.findFirst({
    where: {
      poolAddress: event.transaction.source,
      ownerAddress: event.params.fromAddress,
    },
  });

  if (lpTokenWalletFrom) {
    await prisma.lpTokenWallet.update({
      where: {
        id: lpTokenWalletFrom.id,
      },
      data: {
        shares: (lpTokenWalletFrom.shares as Prisma.JsonArray).map((share) => {
          const typedShare = share as { binId: number; amount: string };

          const updated = amountArray.find(
            (item) => item.binId === typedShare.binId
          );

          if (updated) {
            return {
              binId: typedShare.binId,
              amount: (
                BigInt(typedShare.amount) - BigInt(updated.amount)
              ).toString(),
            };
          }

          return typedShare;
        }) as Prisma.JsonArray,
      },
    });
  }

  if (event.params.toAddress === event.transaction.source) {
    return;
  }

  const lpTokenWalletTo = await prisma.lpTokenWallet.findFirst({
    where: {
      poolAddress: event.transaction.source,
      ownerAddress: event.params.toAddress,
    },
  });

  if (lpTokenWalletTo) {
    const sharesGroupByBinId = _.groupBy(
      [...(lpTokenWalletTo.shares as Prisma.JsonArray), ...amountArray],
      "binId"
    );

    const shares = Object.keys(sharesGroupByBinId).map((key) => {
      const items = sharesGroupByBinId[key];

      return {
        binId: Number(key),
        amount: items
          .reduce((acc, item) => {
            const typedItem = item as { binId: number; amount: string };

            return acc + BigInt(typedItem.amount || "0");
          }, BigInt(0))
          .toString(),
      };
    });

    await prisma.lpTokenWallet.update({
      where: {
        id: lpTokenWalletTo.id,
      },
      data: {
        shares: shares as Prisma.JsonArray,
      },
    });
  } else {
    await prisma.lpTokenWallet.create({
      data: {
        poolAddress: event.transaction.source,
        ownerAddress: event.params.toAddress,
        shares: amountArray as Prisma.JsonArray,
      },
    });
  }
};
