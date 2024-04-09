import prisma from '../../clients/prisma'
import { Trace } from '../../types/ton-api'
import { Cell } from '@ton/core'
import { findTracesByOpCode, parseRaw } from '../../utils/address'
import { EXIT_CODE, OP } from '../../tasks/handleEvent/opCode'

const parseSwap = (raw_body: string) => {
  const message = Cell.fromBoc(Buffer.from(raw_body, 'hex'))[0]
  const body = message.beginParse()
  const op = body.loadUint(32)
  const queryId = body.loadUint(64)
  const toAddress = body.loadAddress().toString()
  const senderAddress = body.loadAddress().toString()
  const jettonAmount = body.loadCoins()
  const minOut = body.loadCoins()
  const hasRef = body.loadUint(1)

  return {
    op,
    queryId,
    toAddress,
    senderAddress,
    jettonAmount,
    minOut,
    hasRef,
  }
}

const parsePayTo = (raw_body: string) => {
  const message = Cell.fromBoc(Buffer.from(raw_body, 'hex'))[0]
  const body = message.beginParse()
  const op = body.loadUint(32)
  const queryId = body.loadUint(64)
  const toAddress = body.loadAddress().toString()
  const exitCode = body.loadUint(32)
  const hasMore = body.loadUint(0)
  const ref = body.loadRef().beginParse()
  const amount0Out = ref.loadCoins()
  const token0Address = ref.loadAddress().toString()
  const amount1Out = ref.loadCoins()
  const token1Address = ref.loadAddress().toString()

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
  }
}

export const handleExchange = async ({
  eventId,
  traces,
}: {
  eventId: string
  traces: Trace
}) => {
  const { hash, utime } = traces.transaction

  const swapTrace = findTracesByOpCode(traces, OP.SWAP)?.[0]
  const payToTrace = findTracesByOpCode(traces, OP.PAY_TO)?.[0]
  if (!swapTrace) {
    console.warn('Empty swapTrace')
    return
  }
  if (!payToTrace) {
    console.warn('Empty payToTrace')
    return
  }

  const swapTraceRawBody = swapTrace.transaction.in_msg?.raw_body || ''
  const payToRawBody = payToTrace.transaction.in_msg?.raw_body || ''
  if (!swapTraceRawBody) {
    console.warn('Empty raw_body swapTrace')
    return null
  }

  if (!payToRawBody) {
    console.warn('Empty raw_body payTo')
    return null
  }

  const { senderAddress, jettonAmount } = parseSwap(swapTraceRawBody)
  const { exitCode, amount0Out, amount1Out } = parsePayTo(payToRawBody)
  const receiverAddress = senderAddress
  const poolAddress = parseRaw(swapTrace?.transaction.account.address)

  // const summary = (function () {
  //   const inToken = jetton_master_in?.name || "TON";
  //   const outToken = jetton_master_out?.name || "TON";
  //   return `${amountIn} ${inToken} -> ${amountOut} ${outToken}`;
  // })();
  // console.log("summary", summary);
  const amountIn = String(jettonAmount)
  const amountOut = String(amount0Out || amount1Out)

  const pool = await prisma.pool.findFirst({
    where: {
      id: poolAddress,
    },
  })

  if (!pool) {
    console.log('Pool not found.')
    return
  }
  const { tokenXAddress } = pool
  const swapForY = senderAddress === tokenXAddress
  const validExitCodes = [EXIT_CODE.SWAP_OK_REF, EXIT_CODE.SWAP_OK] as string[]
  // pay_to can occur in refund scenario
  if (!validExitCodes.includes(String(exitCode))) {
    console.warn('Swap failed. Skip current indexing.')
    console.log('exitCode', EXIT_CODE[exitCode], exitCode)
    return
  }

  const swap = await prisma.swap.findFirst({
    where: { id: hash, eventId },
  })

  if (swap) {
    console.log('Swap already exists.')
    return
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
  })

  let reserveX = BigInt(pool.reserveX)
  let reserveY = BigInt(pool.reserveY)

  if (swapForY) {
    reserveX = reserveX + BigInt(amountIn)
    reserveY = reserveY - BigInt(amountOut)
  } else {
    reserveX = reserveX - BigInt(amountOut)
    reserveY = reserveY + BigInt(amountIn)
  }

  await prisma.pool.update({
    where: {
      id: pool.id,
    },
    data: {
      reserveX: reserveX.toString(),
      reserveY: reserveY.toString(),
    },
  })
}

export default handleExchange
