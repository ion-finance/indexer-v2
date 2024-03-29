import prisma from "../../clients/prisma";
import { AccountEvent, Trace } from "../../types/ton-api";
import { Cell } from "@ton/core";
import { BiDirectionalOP } from "../../tasks/handleEvent";
import { findTracesByOpCode, parseRaw } from "../../utils/address";

const parseSwap = (raw_body: string) => {
  const message = Cell.fromBoc(Buffer.from(raw_body, "hex"))[0];
  const body = message.beginParse();
  const op = body.loadUint(32);
  const queryId = body.loadUint(64);
  const toAddress = body.loadAddress().toString();
  const senderAddress = body.loadAddress().toString();
  const jettonAmount = body.loadCoins();
  const minOut = body.loadCoins();
  const hasRef = body.loadUint(1);

  return {
    op,
    queryId,
    toAddress,
    senderAddress,
    jettonAmount,
    minOut,
    hasRef,
  };
};

const parsePayTo = (raw_body: string) => {
  const message = Cell.fromBoc(Buffer.from(raw_body, "hex"))[0];
  const body = message.beginParse();
  const op = body.loadUint(32);
  const queryId = body.loadUint(64);
  const toAddress = body.loadAddress().toString();
  const exitCode = body.loadUint(32);
  const hasMore = body.loadUint(0);
  const ref = body.loadRef().beginParse();
  const amount0Out = ref.loadCoins();
  const token0Address = ref.loadAddress().toString();
  const amount1Out = ref.loadCoins();
  const token1Address = ref.loadAddress().toString();

  return {
    op,
    queryId,
    toAddress,
    exitCode,
    hasMore,
    amount0Out,
    token0Address,
    amount1Out,
    token1Address,
  };
};

export const handleExchange = async ({
  event,
  traces,
}: {
  event: AccountEvent;
  traces: Trace;
}) => {
  const eventId = event.event_id;
  const { hash, utime } = traces.transaction;
  const jettonSwapAction = event.actions[0].JettonSwap;
  if (!jettonSwapAction) {
    return;
  }
  const {
    amount_in,
    amount_out,
    ton_in,
    ton_out,
    jetton_master_in,
    jetton_master_out,
  } = jettonSwapAction;

  const amountIn = String(amount_in || ton_in);
  const amountOut = String(amount_out || ton_out);

  const swapTrace = findTracesByOpCode(traces, BiDirectionalOP.SWAP)?.[0];
  const payToTrace = findTracesByOpCode(traces, BiDirectionalOP.PAY_TO)?.[0];

  const swapTraceRawBody = swapTrace?.transaction.in_msg?.raw_body || "";
  const payToRawBody = payToTrace?.transaction.in_msg?.raw_body || "";
  if (!swapTraceRawBody) {
    console.warn("Empty raw_body swapTrace");
    return null;
  }

  if (!payToRawBody) {
    console.warn("Empty raw_body payTo");
    return null;
  }

  const { senderAddress } = parseSwap(swapTraceRawBody);
  const { exitCode } = parsePayTo(payToRawBody);
  const receiverAddress = senderAddress;
  const poolAddress = parseRaw(swapTrace?.transaction.account.address);

  // const summary = (function () {
  //   const inToken = jetton_master_in?.name || "TON";
  //   const outToken = jetton_master_out?.name || "TON";
  //   return `${amountIn} ${inToken} -> ${amountOut} ${outToken}`;
  // })();
  // console.log("summary", summary);

  const pool = await prisma.pool.findFirst({
    where: {
      id: poolAddress,
    },
  });

  if (!pool) {
    console.log("Pool not found.");
    return;
  }
  const { tokenXAddress, tokenYAddress } = pool;
  const swapForY = senderAddress === tokenXAddress;

  // swap_ok_ref = 0x45078540 = 1158120768
  // swap_ok = 0xc64370e5 = 3326308581
  const validExitCodes = [1158120768, 3326308581];
  if (!validExitCodes.includes(exitCode)) {
    console.warn("Swap failed. Skip current indexing.");
    return;
  }

  const swap = await prisma.swap.findFirst({
    where: { id: hash, eventId: event.event_id },
  });

  if (swap) {
    console.log("Swap already exists.");
    return;
  }

  await prisma.swap.upsert({
    where: {
      id: hash,
      eventId,
    },
    update: {
      timestamp: utime,
      poolAddress,
      senderAddress,
      receiverAddress,
      amountIn,
      amountOut,
      swapForY,
    },
    create: {
      id: hash,
      eventId,
      timestamp: utime,
      poolAddress,
      senderAddress,
      receiverAddress,
      amountIn,
      amountOut,
      swapForY,
    },
  });

  let reserveX = BigInt(pool.reserveX);
  let reserveY = BigInt(pool.reserveY);

  if (swapForY) {
    reserveX = reserveX + BigInt(amountIn);
    reserveY = reserveY - BigInt(amountOut);
  } else {
    reserveX = reserveX - BigInt(amountOut);
    reserveY = reserveY + BigInt(amountIn);
  }

  await prisma.pool.update({
    where: {
      id: pool.id,
    },
    data: {
      reserveX: reserveX.toString(),
      reserveY: reserveY.toString(),
    },
  });
};

export default handleExchange;
