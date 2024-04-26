import { Address, Cell } from '@ton/core'
import { formatUnits } from 'ethers'
import { find } from 'lodash'

import prisma from 'src/clients/prisma'
import {
  FEE_DIVIDER,
  LP_FEE,
  PROTOCOL_FEE,
  REF_FEE,
} from 'src/dex/simulate/contant'
import { calculateOutAmount } from 'src/dex/simulate/utils'
import { Trace } from 'src/types/ton-api'
import { findTracesByOpCode, isSameAddress, parseRaw } from 'src/utils/address'
import { toISOString } from 'src/utils/date'

import { EXIT_CODE, OP } from '../../tasks/handleEvent/opCode'

const parseSwap = (raw_body: string) => {
  const message = Cell.fromBoc(Buffer.from(raw_body, 'hex'))[0]
  const body = message.beginParse()
  const op = body.loadUint(32)
  const queryId = body.loadUint(64)
  const toAddress = body.loadAddress().toString() //  == pay_to's to_address -> wallet v4
  const senderAddress = body.loadAddress().toString() // router jetton wallet
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
  const toAddress = body.loadAddress().toString() // == swap's to_address -> wallet v4
  const exitCode = body.loadUint(32)
  const hasMore = body.loadUint(0)
  const ref = body.loadRef().beginParse()
  const amount0Out = ref.loadCoins()
  const token0Address = ref.loadAddress().toString() // router jetton wallet
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
  const tokenPrices = await prisma.tokenPrice.findMany()
  const tokens = await prisma.token.findMany()

  const routerAddress = process.env.ROUTER_ADDRESS || ''
  const { hash, utime } = traces.transaction
  const timestamp = toISOString(utime)

  const swapTrace = findTracesByOpCode(traces, OP.SWAP)?.[0]
  const payToTraces = findTracesByOpCode(traces, OP.PAY_TO)
  if (!swapTrace) {
    console.warn('Empty swapTrace')
    return
  }
  if (!payToTraces) {
    console.warn('Empty payToTraces')
    return
  }

  const swapTraceRawBody = swapTrace.transaction.in_msg?.raw_body || ''
  if (!swapTraceRawBody) {
    console.warn('Empty raw_body swapTrace')
    return null
  }

  const {
    senderAddress: sendTokenAddress,
    jettonAmount,
    hasRef,
    toAddress: receiverAddress,
  } = parseSwap(swapTraceRawBody)

  const payToNormalTrace = find(payToTraces, (payToTrace) => {
    const rawBody = payToTrace.transaction.in_msg?.raw_body || ''
    if (!rawBody) {
      return false
    }
    const { exitCode } = parsePayTo(rawBody)
    return exitCode === Number(EXIT_CODE.SWAP_OK)
  })

  const payToRefTrace = find(payToTraces, (payToTrace) => {
    const rawBody = payToTrace.transaction.in_msg?.raw_body || ''
    if (!rawBody) {
      return false
    }
    const { exitCode } = parsePayTo(rawBody)
    return exitCode === Number(EXIT_CODE.SWAP_OK_REF)
  })

  if (!payToNormalTrace) {
    const exitCodes = payToTraces.map((payToTrace) => {
      const rawBody = payToTrace.transaction.in_msg?.raw_body || ''
      if (!rawBody) {
        return null
      }
      const { exitCode } = parsePayTo(rawBody)
      return exitCode
    })
    exitCodes.forEach((exitCode) => {
      if (exitCode === Number(EXIT_CODE.SWAP_REFUND_NO_LIQ)) {
        console.log('Skip failed swap. exit code: SWAP_REFUND_NO_LIQ')
        return
      } else if (exitCode === Number(EXIT_CODE.SWAP_REFUND_RESERVE_ERR)) {
        console.log('Skip failed swap. exit code: SWAP_REFUND_RESERVE_ERR')
        return
      }
    })
    console.warn('Skip failed swap. no pay to with exit code SWAP_OK')
    return
  }

  if (hasRef && !payToRefTrace) {
    console.warn("Empty payToRefTrace given 'hasRef'")
    return
  }

  const payToNormal = parsePayTo(
    payToNormalTrace?.transaction.in_msg?.raw_body || '',
  )
  const payToRef =
    payToRefTrace &&
    parsePayTo(payToRefTrace?.transaction.in_msg?.raw_body || '')

  const { amount0Out, amount1Out } = payToNormal
  const poolAddress = parseRaw(swapTrace?.transaction.account.address)

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

  const { tokenXAddress, tokenYAddress } = pool
  const tokenX = tokens.find((token) => token.id === tokenXAddress)
  const tokenY = tokens.find((token) => token.id === tokenYAddress)
  const tokenPriceX = tokenPrices.find((price) =>
    isSameAddress(price.id, tokenXAddress),
  )
  const tokenPriceY = tokenPrices.find((price) =>
    isSameAddress(price.id, tokenYAddress),
  )
  const priceX = Number(tokenPriceX?.price) || 0
  const priceY = Number(tokenPriceY?.price) || 0
  const swapForY = sendTokenAddress === tokenXAddress

  const swap = await prisma.swap.findFirst({
    where: { id: hash, eventId },
  })

  if (swap) {
    console.log('Swap already exists.')
    return
  }

  const walletTrace = traces
  const senderAddress = parseRaw(walletTrace.transaction.account.address)

  const volumeUsd = swapForY
    ? priceX * Number(formatUnits(Number(amountIn), tokenX?.decimals || 0))
    : priceY * Number(formatUnits(Number(amountIn), tokenY?.decimals || 0))

  await prisma.swap.upsert({
    where: {
      id: hash,
      eventId,
    },
    update: {},
    create: {
      id: hash,
      eventId,
      poolAddress,
      sendTokenAddress,
      receiveTokenAddress: swapForY ? tokenYAddress : tokenXAddress,
      senderAddress,
      receiverAddress,
      amountIn,
      amountOut,
      swapForY,
      volumeUsd: String(volumeUsd),
      timestamp,
    },
  })

  const {
    hash: poolTxHash,
    lt,
    utime: poolUtime,
  } = payToNormalTrace.transaction
  const { protocolFeeOut } = calculateOutAmount({
    amountIn: Number(amountIn),
    hasRef: !!payToRef,
    lpFee: LP_FEE,
    protocolFee: PROTOCOL_FEE,
    refFee: REF_FEE,
    reserveIn: swapForY ? Number(pool.reserveX) : Number(pool.reserveY),
    reserveOut: swapForY ? Number(pool.reserveY) : Number(pool.reserveX),
  })
  const lpFeeAmount = (Number(amountIn) * LP_FEE) / FEE_DIVIDER
  const protocolFeeAmount = protocolFeeOut
  const referralFeeAmount = Number(
    payToRef ? payToRef.amount0Out || payToRef.amount1Out : 0,
  )

  const res = (function () {
    const assetOutAmount = Number(amountOut)
    const assetOutDelta =
      assetOutAmount + (protocolFeeAmount + referralFeeAmount)
    if (swapForY) {
      return {
        asset0Delta: Number(amountIn),
        asset0Amount: Number(amountIn),
        asset1Delta: -assetOutDelta,
        asset1Amount: -assetOutAmount,
      }
    } else {
      return {
        asset0Delta: -assetOutDelta,
        asset0Amount: -assetOutAmount,
        asset1Delta: Number(amountIn),
        asset1Amount: Number(amountIn),
      }
    }
  })()
  const { asset0Delta, asset0Amount, asset1Delta, asset1Amount } = res

  await prisma.operation.create({
    data: {
      poolTxHash: poolTxHash,
      poolAddress: pool.id,
      routerAddress,
      poolTxLt: String(lt),
      poolTxTimestamp: new Date(poolUtime * 1000).toISOString(), // save timestamp in UTC+0
      destinationWalletAddress: receiverAddress,
      operationType: 'swap',
      exitCode: 'swap_ok',

      // if swap is for Y, then asset0 is tokenX and asset1 is tokenY
      asset0Address: tokenXAddress,
      asset0Amount: String(asset0Amount),
      asset0Delta: String(asset0Delta),
      asset0Reserve: pool.reserveX,

      asset1Address: tokenYAddress,
      asset1Amount: String(asset1Amount),
      asset1Delta: String(asset1Delta),
      asset1Reserve: pool.reserveY,

      lpTokenDelta: '0', // always 0 for swap
      lpTokenSupply: pool.lpSupply, // TODO: check lpTSupply before or after

      lpFeeAmount: String(lpFeeAmount),
      protocolFeeAmount: String(protocolFeeAmount),
      referralFeeAmount: String(referralFeeAmount),

      walletAddress: senderAddress,
      walletTxLt: String(walletTrace.transaction.lt),
      walletTxHash: walletTrace.transaction.hash,
      walletTxTimestamp: new Date(
        walletTrace.transaction.utime * 1000,
      ).toISOString(),
    },
  })

  let reserveX = BigInt(pool.reserveX)
  let reserveY = BigInt(pool.reserveY)
  let collectedXProtocolFee = BigInt(pool.collectedXProtocolFee)
  let collectedYProtocolFee = BigInt(pool.collectedYProtocolFee)

  // !NOTE: Use amountOut, referralFeeAmount of block data, not simulated one.
  const out =
    BigInt(amountOut) + BigInt(protocolFeeAmount) + BigInt(referralFeeAmount)

  if (swapForY) {
    reserveX = reserveX + BigInt(amountIn)
    reserveY = reserveY - out
    collectedYProtocolFee = collectedYProtocolFee + BigInt(protocolFeeAmount)
  } else {
    reserveX = reserveX - out
    reserveY = reserveY + BigInt(amountIn)
    collectedXProtocolFee = collectedXProtocolFee + BigInt(protocolFeeAmount)
  }

  await prisma.pool.update({
    where: {
      id: pool.id,
    },
    data: {
      reserveX: reserveX.toString(),
      reserveY: reserveY.toString(),
      collectedXProtocolFee: collectedXProtocolFee.toString(),
      collectedYProtocolFee: collectedYProtocolFee.toString(),
    },
  })
}

export default handleExchange
