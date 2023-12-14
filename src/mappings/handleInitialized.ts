import prisma from "../clients/prisma";
import { Event } from "../types/events";
import parseInitialized from "../parsers/parseInitialized";
import fetchTokenData from "../utils/fetchTokenData";

const handleInitialized = async (
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

export default handleInitialized;
