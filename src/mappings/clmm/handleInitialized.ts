import prisma from "../../clients/prisma";
import { Event } from "../../types/events";
import parseInitialized from "../../parsers/clmm/parseInitialized";
import fetchTokenData from "../../utils/fetchTokenData";

const handleInitialized = async (event: Event) => {
  const params = parseInitialized(event.body);
  console.log("Initialized event is indexed.");
  console.log(event);

  const [tokenXdata, tokenYdata] = await Promise.all([
    fetchTokenData(params.tokenXAddress),
    fetchTokenData(params.tokenYAddress),
  ]);

  if (tokenXdata) {
    await prisma.token.upsert({
      where: {
        id: params.tokenXAddress,
      },
      update: {
        jettonMinterAddress: tokenXdata.minter_address,
        name: tokenXdata.metadata.name,
        symbol: tokenXdata.metadata.symbol,
        decimals: parseInt(tokenXdata.metadata.decimals),
        image: tokenXdata.metadata.image,
      },
      create: {
        id: params.tokenXAddress,
        jettonMinterAddress: tokenXdata.minter_address,
        name: tokenXdata.metadata.name,
        symbol: tokenXdata.metadata.symbol,
        decimals: parseInt(tokenXdata.metadata.decimals),
        image: tokenXdata.metadata.image,
      },
    });
  }
  if (tokenYdata) {
    await prisma.token.upsert({
      where: {
        id: params.tokenYAddress,
      },
      update: {
        jettonMinterAddress: tokenYdata.minter_address,
        name: tokenYdata.metadata.name,
        symbol: tokenYdata.metadata.symbol,
        decimals: parseInt(tokenYdata.metadata.decimals),
        image: tokenYdata.metadata.image,
      },
      create: {
        id: params.tokenYAddress,
        jettonMinterAddress: tokenYdata.minter_address,
        name: tokenYdata.metadata.name,
        symbol: tokenYdata.metadata.symbol,
        decimals: parseInt(tokenYdata.metadata.decimals),
        image: tokenYdata.metadata.image,
      },
    });
  }

  const tokenXSymbol = tokenXdata?.metadata.symbol;
  const tokenYSymbol = tokenYdata?.metadata.symbol;

  await prisma.pool.upsert({
    where: {
      id: event.transaction.source,
    },
    update: {},
    create: {
      id: event.transaction.source,
      tokenXAddress: params.tokenXAddress,
      tokenYAddress: params.tokenYAddress,
      binStep: params.binStep,
      name: `${tokenXSymbol} - ${tokenYSymbol}`,
      activeBinId: params.activeId,
    },
  });
};

export default handleInitialized;
