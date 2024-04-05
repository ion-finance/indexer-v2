import { Event } from '../../types/events'
import prisma from '../../clients/prisma'
import parseRemoveLiquidity from '../../parsers/cpmm/parseRemoveLiquidity'
import { AccountEvent, Trace } from '@/src/types/ton-api'
import { findTracesByOpCode, parseRaw } from '../../utils/address'
import { EXIT_CODE, OP } from '../../tasks/handleEvent/opCode'
import { Cell } from '@ton/core'

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
    jettonAmount,
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
    amount0Out,
    token0Address,
    amount1Out,
    token1Address,
  }
}

export const handleRemoveLiquidity = async ({
  event,
  traces,
}: {
  event: AccountEvent
  traces: Trace
}) => {
  const eventId = event.event_id
  const { hash, utime } = traces.transaction
  const payToTrace = findTracesByOpCode(traces, OP.PAY_TO)?.[0]
  const burnNotificationTrace = findTracesByOpCode(
    traces,
    OP.BURN_NOTIFICATION,
  )?.[0]
  if (!payToTrace) {
    console.warn('Empty payToTrace')
    return
  }
  if (!burnNotificationTrace) {
    console.warn('Empty burnNotificationTrace')
    return
  }
  const payToRawBody = payToTrace.transaction.in_msg?.raw_body || ''
  const burnNotificationRawBody =
    burnNotificationTrace.transaction.in_msg?.raw_body || ''
  if (!payToRawBody) {
    console.warn('Empty raw_body payTo')
    return null
  }
  if (!burnNotificationRawBody) {
    console.warn('Empty raw_body burnNotificationRawBody')
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
    console.log('Pool not found.')
    return
  }

  const withdraw = await prisma.withdraw.findFirst({
    where: { id: hash, eventId },
  })

  if (withdraw) {
    console.log('withdraw already exists.')
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
      amountX: String(amount0Out),
      amountY: String(amount1Out),
      timestamp: utime,
    },
  })

  await prisma.pool.update({
    where: {
      id: pool.id,
    },
    data: {
      reserveX: (BigInt(pool.reserveX) - amount0Out).toString(),
      reserveY: (BigInt(pool.reserveY) - amount1Out).toString(),
      lpSupply: (BigInt(pool.lpSupply) - BigInt(burned)).toString(),
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
        amount: (BigInt(lpTokenWallet.amount) - BigInt(burned)).toString(),
      },
    })
  } else {
    await prisma.lpTokenWallet.create({
      data: {
        poolAddress,
        ownerAddress: senderAddress,
        amount: '0',
      },
    })
  }
}

export default handleRemoveLiquidity
