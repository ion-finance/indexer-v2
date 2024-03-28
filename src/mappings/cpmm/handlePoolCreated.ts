import prisma from "../../clients/prisma";
import fetchTokenData from "../../utils/fetchTokenData";
import { PoolType } from "@prisma/client";
import { AccountEvent, Trace } from "../../types/ton-api";
import { Cell, address } from "@ton/core";
import { BiDirectionalOP } from "../../tasks/handleEvent";
import {
  changeNameOfProxyTon,
  changeSymbolOfProxyTon,
  findTracesByOpCode,
  parseRaw,
  sortByAddress,
} from "../../utils/address";
const parseTransferNotification = (raw_body: string) => {
  const message = Cell.fromBoc(Buffer.from(raw_body, "hex"))[0];
  const body = message.beginParse();
  const op = body.loadUint(32);
  const queryId = body.loadUint(64);
  const jettonAmount = body.loadCoins();
  const fromUser = body.loadAddress().toString();
  const c = body.loadRef();
  const cs = c.beginParse();
  const transferredOp = cs.loadUint(32);
  const tokenWallet1 = cs.loadAddress().toString(); // router jetton wallet
  const minLpOut = cs.loadCoins();

  return {
    op,
    queryId,
    jettonAmount,
    fromUser,
    transferredOp,
    tokenWallet1,
    minLpOut,
  };
};

export const handlePoolCreated = async ({
  event,
  traces,
}: {
  event: AccountEvent;
  traces: Trace;
}) => {
  const provideLpTrace = findTracesByOpCode(
    traces,
    BiDirectionalOP.PROVIDE_LP
  )?.[0];
  const poolAddress = parseRaw(
    provideLpTrace.transaction?.in_msg?.destination?.address
  );

  const transferNotificationTrace = findTracesByOpCode(
    traces,
    BiDirectionalOP.TRANSFER_NOTIFICATION
  )?.[0];

  const { raw_body, source } =
    transferNotificationTrace.transaction.in_msg || {};
  if (!raw_body) {
    console.warn("Empty raw_body");
    return null;
  }
  if (!source) {
    console.warn("Empty source");
    return null;
  }

  // router jetton wallets
  const { tokenWallet1 } = parseTransferNotification(raw_body);
  const sourceAddress = parseRaw(source.address);
  const sorted = sortByAddress([address(tokenWallet1), address(sourceAddress)]);
  const tokenXAddress = sorted[0].toString();
  const tokenYAddress = sorted[1].toString();

  const [tokenXdata, tokenYdata] = await Promise.all([
    fetchTokenData(tokenXAddress),
    fetchTokenData(tokenYAddress),
  ]);
  console.log("tokenXdata", tokenXdata);
  console.log("tokenYdata", tokenYdata);

  if (tokenXdata) {
    await prisma.token.upsert({
      where: {
        id: tokenXAddress,
      },
      update: {
        jettonMinterAddress: tokenXdata.minter_address,
        name: changeNameOfProxyTon(tokenXdata.metadata.name),
        symbol: changeSymbolOfProxyTon(tokenXdata.metadata.symbol),
        decimals: parseInt(tokenXdata.metadata.decimals),
        image: tokenXdata.metadata.image,
      },
      create: {
        id: tokenXAddress,
        jettonMinterAddress: tokenXdata.minter_address,
        name: changeNameOfProxyTon(tokenXdata.metadata.name),
        symbol: changeSymbolOfProxyTon(tokenXdata.metadata.symbol),
        decimals: parseInt(tokenXdata.metadata.decimals),
        image: tokenXdata.metadata.image,
      },
    });
  }

  if (tokenYdata) {
    await prisma.token.upsert({
      where: {
        id: tokenYAddress,
      },
      update: {
        jettonMinterAddress: tokenYdata.minter_address,
        name: changeNameOfProxyTon(tokenYdata.metadata.name),
        symbol: changeSymbolOfProxyTon(tokenYdata.metadata.symbol),
        decimals: parseInt(tokenYdata.metadata.decimals),
        image: tokenYdata.metadata.image,
      },
      create: {
        id: tokenYAddress,
        jettonMinterAddress: tokenYdata.minter_address,
        name: changeNameOfProxyTon(tokenYdata.metadata.name),
        symbol: changeSymbolOfProxyTon(tokenYdata.metadata.symbol),
        decimals: parseInt(tokenYdata.metadata.decimals),
        image: tokenYdata.metadata.image,
      },
    });
  }
  const tokenXSymbol = changeSymbolOfProxyTon(
    tokenXdata?.metadata?.symbol || ""
  );
  const tokenYSymbol = changeSymbolOfProxyTon(
    tokenYdata?.metadata?.symbol || ""
  );

  await prisma.pool.upsert({
    where: {
      id: poolAddress,
    },
    create: {
      id: poolAddress,
      name: `${tokenXSymbol}-${tokenYSymbol}`,
      type: PoolType.CPMM,
      tokenXAddress: tokenXAddress,
      tokenYAddress: tokenYAddress,
    },
    update: {},
  });
};

export default handlePoolCreated;
