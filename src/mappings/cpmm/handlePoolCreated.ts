import { Event } from "../../types/events";
import prisma from "../../clients/prisma";
import parsePoolCreated from "../../parsers/cpmm/parsePoolCreated";
import fetchTokenData from "../../utils/fetchTokenData";
import { PoolType } from "@prisma/client";

// TODO
// Refactor event args
// coins => tokenX, tokenY
export const handlePoolCreated = async (event: Event) => {
  console.log("PoolCreated event is indexed");
  console.log(event);

  const params = parsePoolCreated(event.body);
  const tokenXAddress = params.coins[0];
  const tokenYAddress = params.coins[1];

  const [tokenXdata, tokenYdata] = await Promise.all([
    fetchTokenData(tokenXAddress),
    fetchTokenData(tokenYAddress),
  ]);

  const [tokenX, tokenY] = await Promise.all([
    prisma.token.upsert({
      where: {
        id: tokenXAddress,
      },
      update: {
        jettonMinterAddress: tokenXdata.minter_address,
        name: tokenXdata.metadata.name,
        symbol: tokenXdata.metadata.symbol,
        decimals: parseInt(tokenXdata.metadata.decimals),
        image: tokenXdata.metadata.image,
      },
      create: {
        id: tokenXAddress,
        jettonMinterAddress: tokenXdata.minter_address,
        name: tokenXdata.metadata.name,
        symbol: tokenXdata.metadata.symbol,
        decimals: parseInt(tokenXdata.metadata.decimals),
        image: tokenXdata.metadata.image,
      },
    }),
    prisma.token.upsert({
      where: {
        id: tokenYAddress,
      },
      update: {
        jettonMinterAddress: tokenYdata.minter_address,
        name: tokenYdata.metadata.name,
        symbol: tokenYdata.metadata.symbol,
        decimals: parseInt(tokenYdata.metadata.decimals),
        image: tokenYdata.metadata.image,
      },
      create: {
        id: tokenYAddress,
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
      id: params.poolAddress,
    },
    create: {
      id: event.transaction.source,
      name: `${tokenX.symbol}-${tokenY.symbol}`,
      type: PoolType.CPMM,
      tokenXAddress: tokenXAddress,
      tokenYAddress: tokenYAddress,
    },
    update: {},
  });
};
