import { Event } from "../../types/events";
import prisma from "../../clients/prisma";
import parsePoolCreated from "../../parsers/cpmm/parsePoolCreated";
import fetchTokenData from "../../utils/fetchTokenData";
import { PoolType } from "@prisma/client";

export const handlePoolCreated = async (event: Event) => {
  const params = parsePoolCreated(event.body);
  console.log("PoolCreated event is indexed");
  console.log(params);

  const [tokenXdata, tokenYdata] = await Promise.all([
    fetchTokenData(params.tokenXAddress),
    fetchTokenData(params.tokenYAddress),
  ]);

  const changeNameOfProxyTon = (name: string) => {
    if (name === "Proxy TON") {
      return "TON";
    }
    return name;
  };

  const changeSymbolOfProxyTon = (symbol: string) => {
    if (symbol === "pTON") {
      return "TON";
    }
    return symbol;
  };

  const [tokenX, tokenY] = await Promise.all([
    prisma.token.upsert({
      where: {
        id: params.tokenXAddress,
      },
      update: {
        jettonMinterAddress: tokenXdata.minter_address,
        name: changeNameOfProxyTon(tokenXdata.metadata.name),
        symbol: changeSymbolOfProxyTon(tokenXdata.metadata.symbol),
        decimals: parseInt(tokenXdata.metadata.decimals),
        image: tokenXdata.metadata.image,
      },
      create: {
        id: params.tokenXAddress,
        jettonMinterAddress: tokenXdata.minter_address,
        name: changeNameOfProxyTon(tokenXdata.metadata.name),
        symbol: changeSymbolOfProxyTon(tokenXdata.metadata.symbol),
        decimals: parseInt(tokenXdata.metadata.decimals),
        image: tokenXdata.metadata.image,
      },
    }),
    prisma.token.upsert({
      where: {
        id: params.tokenYAddress,
      },
      update: {
        jettonMinterAddress: tokenYdata.minter_address,
        name: changeNameOfProxyTon(tokenYdata.metadata.name),
        symbol: changeSymbolOfProxyTon(tokenYdata.metadata.symbol),
        decimals: parseInt(tokenYdata.metadata.decimals),
        image: tokenYdata.metadata.image,
      },
      create: {
        id: params.tokenYAddress,
        jettonMinterAddress: tokenYdata.minter_address,
        name: changeNameOfProxyTon(tokenYdata.metadata.name),
        symbol: changeSymbolOfProxyTon(tokenYdata.metadata.symbol),
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
      id: params.poolAddress,
      name: `${tokenX.symbol}-${tokenY.symbol}`,
      type: PoolType.CPMM,
      tokenXAddress: params.tokenXAddress,
      tokenYAddress: params.tokenYAddress,
    },
    update: {},
  });
};

export default handlePoolCreated;
