import prisma from "../../clients/prisma";
import { AccountEvent } from "../../types/ton-api";
import { findTracesByOpCode, parseRaw } from "../../utils/address";
import { BiDirectionalOP } from "../../tasks/handleEvent";
import { Cell } from "@ton/core";

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
  traces: any;
}) => {
  const cbAddLiquidityTrace = findTracesByOpCode(
    traces,
    BiDirectionalOP.CB_ADD_LIQUIDITY
  )?.[0];
  const poolAddress = parseRaw(
    cbAddLiquidityTrace?.transaction.in_msg.destination.address
  );
  const { amount0, amount1, minLpOut, op, queryId, userAddress } =
    parseCbAddLiquidity(cbAddLiquidityTrace?.transaction.in_msg.raw_body);

  const internalTransferTraces = findTracesByOpCode(
    traces,
    BiDirectionalOP.INTERNAL_TRANSFER
  );
  const mintTrace = internalTransferTraces?.find(
    (trace: any) =>
      parseRaw(trace.transaction.in_msg.source.address) === poolAddress
  );
  const { amount: minted, to } = parseMint(
    mintTrace?.transaction.in_msg.raw_body
  );
  if (!to) {
    console.warn("Initial Liquidity found. Skip this event.");
    return;
  }

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

  await prisma.pool.update({
    where: {
      id: pool.id,
    },
    data: {
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
