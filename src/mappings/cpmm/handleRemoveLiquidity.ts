import { Cell } from '@ton/core'
import BigNumber from 'bignumber.js'

import prisma from 'src/clients/prisma'
import { OP } from 'src/tasks/handleEvent/opCode'
import { Trace } from 'src/types/ton-api'
import {
  findTracesByOpCode,
  // findTracesOfPool,
  parseRaw,
} from 'src/utils/address'
import { bigIntToBigNumber } from 'src/utils/bigNumber'
import { toISOString } from 'src/utils/date'
import { warn } from 'src/utils/log'

const parseBurnNotification = (raw_body: string) => {
  const message = Cell.fromBoc(Buffer.from(raw_body, 'hex'))[0]
  const body = message.beginParse()
  const op = body.loadUint(32)
  const queryId = body.loadUint(64)

  const jettonAmount = body.loadCoins()
  const fromAddress = body.loadAddress().toString()
  const responseAddress = body.loadAddress().toString()

  return {
    op,
    queryId,
    jettonAmount: bigIntToBigNumber(jettonAmount),
    fromAddress,
    responseAddress,
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
    amount0Out: bigIntToBigNumber(amount0Out),
    token0Address,
    amount1Out: bigIntToBigNumber(amount1Out),
    token1Address,
  }
}

export const handleRemoveLiquidity = async ({
  eventId,
  trace,
}: {
  eventId: string
  trace: Trace
}) => {
  const routerAddress = process.env.ROUTER_ADDRESS || ''
  const { hash, utime } = trace.transaction
  const timestamp = toISOString(utime)
  const payToTrace = findTracesByOpCode(trace, OP.PAY_TO)?.[0]
  const burnNotificationTrace = findTracesByOpCode(
    trace,
    OP.BURN_NOTIFICATION,
  )?.[0]
  if (!payToTrace) {
    warn('Empty payToTrace')
    return
  }
  if (!burnNotificationTrace) {
    warn('Empty burnNotificationTrace')
    return
  }
  const payToRawBody = payToTrace.transaction.in_msg?.raw_body || ''
  const burnNotificationRawBody =
    burnNotificationTrace.transaction.in_msg?.raw_body || ''
  if (!payToRawBody) {
    warn('Empty raw_body payTo')
    return null
  }
  if (!burnNotificationRawBody) {
    warn('Empty raw_body burnNotificationRawBody')
    return null
  }
  const { toAddress, amount0Out, amount1Out } = parsePayTo(payToRawBody)

  const { jettonAmount: burned, fromAddress } = parseBurnNotification(
    burnNotificationRawBody,
  )
  const poolAddress = parseRaw(
    payToTrace.transaction.in_msg?.source?.address.toString(),
  )

  const pool = await prisma.pool.findFirst({
    where: {
      id: poolAddress,
    },
  })

  if (!pool) {
    warn('Pool not found.')
    return
  }

  const withdraw = await prisma.withdraw.findFirst({
    where: { id: hash, eventId },
  })

  if (withdraw) {
    warn('withdraw already exists.')
    return
  }

  const senderAddress = fromAddress

  await prisma.withdraw.upsert({
    where: {
      id: hash,
      eventId,
    },
    update: {},
    create: {
      id: hash,
      eventId,
      senderAddress,
      receiverAddress: toAddress,
      poolAddress,
      amountX: amount0Out.toString(),
      amountY: amount1Out.toString(),
      burned: burned.toString(),
      timestamp,
    },
  })

  const walletTrace = trace
  // const poolTraces = findTracesOfPool(trace, poolAddress)
  const poolTrace = burnNotificationTrace
  const { tokenXAddress, tokenYAddress } = pool
  const { hash: poolTxHash, lt, utime: poolUtime } = poolTrace.transaction

  await prisma.operation.create({
    data: {
      poolTxHash: poolTxHash,
      poolAddress: pool.id,
      routerAddress,
      poolTxLt: String(lt),
      poolTxTimestamp: new Date(poolUtime * 1000).toISOString(),
      destinationWalletAddress: toAddress,
      operationType: 'withdraw_liquidity',
      exitCode: 'burn_ok',

      asset0Address: tokenXAddress,
      asset0Amount: (-amount0Out).toString(),
      asset0Delta: '0', // always 0 for withdraw
      asset0Reserve: pool.reserveX,

      asset1Address: tokenYAddress,
      asset1Amount: (-amount1Out).toString(),
      asset1Delta: '0',
      asset1Reserve: pool.reserveY,

      lpTokenDelta: String(-burned),
      lpTokenSupply: pool.lpSupply,

      lpFeeAmount: '0', // always 0 for withdraw
      protocolFeeAmount: '0',
      referralFeeAmount: '0',

      walletAddress: walletTrace.transaction.in_msg?.source?.address,
      walletTxLt: String(walletTrace.transaction.lt),
      walletTxHash: walletTrace.transaction.hash,
      walletTxTimestamp: new Date(
        walletTrace.transaction.utime * 1000,
      ).toISOString(),
    },
  })

  await prisma.pool.update({
    where: {
      id: pool.id,
    },
    data: {
      reserveX: BigNumber(pool.reserveX).minus(amount0Out).toString(),
      reserveY: BigNumber(pool.reserveY).minus(amount1Out).toString(),
      lpSupply: BigNumber(pool.lpSupply).minus(burned).toString(),
    },
  })

  const lpTokenWallet = await prisma.lpTokenWallet.findFirst({
    where: {
      poolAddress,
      ownerAddress: senderAddress,
    },
  })

  if (lpTokenWallet) {
    await prisma.lpTokenWallet.update({
      where: {
        id: lpTokenWallet.id,
      },
      data: {
        amount: BigNumber(lpTokenWallet.amount).minus(burned).toString(),
      },
    })
  } else {
    await prisma.lpTokenWallet.create({
      data: {
        poolAddress,
        ownerAddress: senderAddress,
        amount: '0',
        timestamp,
      },
    })
  }
}

export default handleRemoveLiquidity
