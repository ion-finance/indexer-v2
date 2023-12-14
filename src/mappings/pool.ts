import { Event, DepositedToBinsParams } from "../types/events";
import prisma from "../clients/prisma";
import { Prisma } from "@prisma/client";
import parseInitialized from "../parsers/parseInitialized";
import fetchTokenData from "../utils/fetchTokenData";
import parseSwap from "../parsers/parseSwap";
import parseWithdrawnFromBins from "../parsers/parseWithdrawnFromBins";
import parseTransferBatch from "../parsers/parseTransferBatch";
import _ from "lodash";

export const handleInitialized = async (
  event: Event<ReturnType<typeof parseInitialized>>
) => {
  console.log("Initialized event is indexed.");
  console.log(event);

  const [tokenXdata, tokenYdata] = await Promise.all([
    fetchTokenData(event.params.tokenXAddress),
    fetchTokenData(event.params.tokenYAddress),
  ]);

  const [tokenX, tokenY] = await Promise.all([
    prisma.token.upsert({
      where: {
        id: event.params.tokenXAddress,
      },
      update: {
        jettonMinterAddress: tokenXdata.minter_address,
        name: tokenXdata.metadata.name,
        symbol: tokenXdata.metadata.symbol,
        decimals: parseInt(tokenXdata.metadata.decimals),
        image: tokenXdata.metadata.image,
      },
      create: {
        id: event.params.tokenXAddress,
        jettonMinterAddress: tokenXdata.minter_address,
        name: tokenXdata.metadata.name,
        symbol: tokenXdata.metadata.symbol,
        decimals: parseInt(tokenXdata.metadata.decimals),
        image: tokenXdata.metadata.image,
      },
    }),
    prisma.token.upsert({
      where: {
        id: event.params.tokenYAddress,
      },
      update: {
        jettonMinterAddress: tokenYdata.minter_address,
        name: tokenYdata.metadata.name,
        symbol: tokenYdata.metadata.symbol,
        decimals: parseInt(tokenYdata.metadata.decimals),
        image: tokenYdata.metadata.image,
      },
      create: {
        id: event.params.tokenYAddress,
        jettonMinterAddress: tokenYdata.minter_address,
        name: tokenYdata.metadata.name,
        symbol: tokenYdata.metadata.symbol,
        decimals: parseInt(tokenYdata.metadata.decimals),
        image: tokenYdata.metadata.image,
      },
    }),
  ]);

  await prisma.pool.upsert({
    where: {
      id: event.transaction.source,
    },
    update: {},
    create: {
      id: event.transaction.source,
      tokenXAddress: event.params.tokenXAddress,
      tokenYAddress: event.params.tokenYAddress,
      binStep: event.params.binStep,
      name: `${tokenX.symbol}-${tokenY.symbol}`,
      activeBinId: event.params.activeId,
    },
  });
};

export const handleDepositedToBins = async (
  event: Event<DepositedToBinsParams>
) => {
  console.log("DepositedToBins event is indexed.");
  console.log(event);

  const depositedArray = event.params.deposited.keys().map((key) => {
    return {
      binId: key,
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
      const isX = event.params.tokenAddress === pool?.tokenXAddress;

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

export const handleWithdrawnFromBins = async (
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
