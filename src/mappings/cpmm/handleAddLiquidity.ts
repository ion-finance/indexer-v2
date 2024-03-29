import prisma from "../../clients/prisma";
import { AccountEvent, Trace } from "../../types/ton-api";
import { findTracesByOpCode, parseRaw } from "../../utils/address";
import { Cell } from "@ton/core";
import { upsertToken } from "./upsertToken";
import { OP } from "../../tasks/handleEvent/opCode";

const parseMint = (raw_body: string) => {
  const message = Cell.fromBoc(Buffer.from(raw_body, "hex"))[0];
  const body = message.beginParse();
  const op = body.loadUint(32);
  const queryId = body.loadUint(64);
  const amount = body.loadCoins();
  const poolAddress = body.loadAddress().toString();
  const to = body.loadMaybeAddress();

  return {
    op,
    queryId,
    amount,
    poolAddress,
    to,
  };
};

const parseCbAddLiquidity = (raw_body: string) => {
  const message = Cell.fromBoc(Buffer.from(raw_body, "hex"))[0];
  const body = message.beginParse();
  const op = body.loadUint(32);
  const queryId = body.loadUint(64);

  const amount0 = body.loadCoins();
  const amount1 = body.loadCoins();
  const userAddress = body.loadAddress().toString();
  const minLpOut = body.loadCoins();

  return {
    op,
    queryId,
    amount0,
    amount1,
    userAddress,
    minLpOut,
  };
};

export const handleAddLiquidity = async ({
  event,
  traces,
}: {
  event: AccountEvent;
  traces: Trace;
}) => {
  const cbAddLiquidityTrace = findTracesByOpCode(
    traces,
    OP.CB_ADD_LIQUIDITY
  )?.[0];
  if (!cbAddLiquidityTrace) {
    console.warn("Empty cbAddLiquidityTrace");
    return;
  }

  const { raw_body: cbAddLiquidityBody, destination } =
    cbAddLiquidityTrace?.transaction.in_msg || {};
  if (!cbAddLiquidityBody) {
    console.warn("Empty raw_body cbAddLiquidityTrace");
    return;
  }
  if (!destination) {
    console.warn("Empty destination cbAddLiquidityTrace");
    return;
  }
  const poolAddress = parseRaw(destination.address);
  const { amount0, amount1, userAddress } =
    parseCbAddLiquidity(cbAddLiquidityBody);

  const internalTransferTraces = findTracesByOpCode(
    traces,
    OP.INTERNAL_TRANSFER
  );
  if (!internalTransferTraces) {
    console.warn("Empty internalTransferTraces");
    return;
  }

  const mintTrace = internalTransferTraces?.find(
    (trace: Trace) =>
      parseRaw(trace.transaction.in_msg?.source?.address) === poolAddress
  );

  const { raw_body: mintRawBody } = mintTrace?.transaction.in_msg || {};
  if (!mintRawBody) {
    console.warn("Empty raw_body mintTrace");
    return;
  }

  const { amount: minted } = parseMint(mintRawBody);
  // if (!to) {
  //   console.warn("Initial Liquidity found. Skip this event.");
  //   return;
  // }

  const pool = await prisma.pool.findFirst({
    where: {
      id: poolAddress,
    },
  });

  if (!pool) {
    console.log("Pool not found.");
    return;
  }

  const hash = traces.transaction.hash;
  const eventId = event.event_id;
  const timestamp = traces.transaction.utime;

  const deposit = await prisma.deposit.findFirst({
    where: { id: hash, eventId },
  });

  if (deposit) {
    console.log("deposit already exists.");
    return;
  }

  const amountX = String(amount0);
  const amountY = String(amount1);

  await prisma.deposit.upsert({
    where: {
      id: hash,
      eventId: event.event_id,
    },
    update: {
      senderAddress: userAddress,
      receiverAddress: userAddress,
      poolAddress,
      amountX,
      amountY,
      timestamp,
    },
    create: {
      id: hash,
      eventId: event.event_id,
      senderAddress: userAddress,
      receiverAddress: userAddress,
      poolAddress,
      tokenAddress: pool.tokenXAddress, // TODO : In case of cpmm, tokenXAddress is unnecessary.
      amountX,
      amountY,
      timestamp,
    },
  });

  const tokens = await prisma.token.findMany();
  const { tokenXAddress, tokenYAddress } = pool;
  const tokenX = tokens.find((token) => token.id === tokenXAddress);
  const tokenY = tokens.find((token) => token.id === tokenYAddress);

  // if tokenX is empty, it means router_token_x is not initilized yet.
  const updatedTokenX = tokenX ? tokenX : await upsertToken(tokenXAddress);
  const updatedTokenY = tokenY ? tokenY : await upsertToken(tokenYAddress);
  const name = `${updatedTokenX?.symbol}-${updatedTokenY?.symbol}`;

  await prisma.pool.update({
    where: {
      id: pool.id,
    },
    data: {
      name,
      reserveX: (BigInt(pool.reserveX) + BigInt(amountX)).toString(),
      reserveY: (BigInt(pool.reserveY) + BigInt(amountY)).toString(),
      lpSupply: (BigInt(pool.lpSupply) + BigInt(minted)).toString(),
    },
  });

  const lpTokenWallet = await prisma.lpTokenWallet.findFirst({
    where: {
      poolAddress,
      ownerAddress: userAddress,
    },
  });

  if (lpTokenWallet) {
    await prisma.lpTokenWallet.update({
      where: {
        id: lpTokenWallet.id,
      },
      data: {
        amount: (BigInt(lpTokenWallet.amount) + BigInt(minted)).toString(),
      },
    });
  } else {
    await prisma.lpTokenWallet.create({
      data: {
        poolAddress,
        ownerAddress: userAddress,
        amount: BigInt(minted).toString(),
      },
    });
  }
};

export default handleAddLiquidity;
