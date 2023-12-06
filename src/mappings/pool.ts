import { Event, DepositedToBinsParams } from "../types/events";
import prisma from "../clients/prisma";
import { Prisma } from "@prisma/client";
import parseInitialized from "../parsers/parseInitialized";
import fetchTokenData from "../utils/fetchTokenData";

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
        jettonMinterAddress: tokenXdata.minter_address,
        name: tokenXdata.metadata.name,
        symbol: tokenXdata.metadata.symbol,
        decimals: parseInt(tokenXdata.metadata.decimals),
        image: tokenXdata.metadata.image,
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
      const bin = bins.find(
        (bin) =>
          bin.binId === deposited.binId &&
          bin.tokenAddress === event.params.tokenAddress
      );

      if (bin) {
        return prisma.bins.updateMany({
          where: {
            binId: deposited.binId,
            poolAddress: event.transaction.source,
            tokenAddress: event.params.tokenAddress,
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
            binId: deposited.binId,
            poolAddress: event.transaction.source,
            tokenAddress: event.params.tokenAddress,
            reserve: deposited.amount.toString(),
          },
        });
      }
    })
  );
};
