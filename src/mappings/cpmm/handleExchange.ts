import { Cell } from '@ton/core'
import BigNumber from 'bignumber.js'
import { find } from 'lodash'

import prisma from 'src/clients/prisma'
import getLatestTokenPrices from 'src/common/tokenPrice'
import {
  FEE_DIVIDER,
  LP_FEE,
  PROTOCOL_FEE,
  REF_FEE,
} from 'src/dex/simulate/contant'
import { calculateOutAmount } from 'src/dex/simulate/utils'
import { Trace } from 'src/types/ton-api'
import { findTracesByOpCode, isSameAddress, parseRaw } from 'src/utils/address'
import { bFormatUnits, bigIntToBigNumber } from 'src/utils/bigNumber'
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
    jettonAmount: bigIntToBigNumber(jettonAmount),
    minOut: bigIntToBigNumber(minOut),
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
    amount0Out: bigIntToBigNumber(amount0Out),
    token0Address,
    amount1Out: bigIntToBigNumber(amount1Out),
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
  const tokenPrices = await getLatestTokenPrices()
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

  const amountIn = jettonAmount

  const amountOut = (function () {
    if (amount0Out.isZero()) {
      return amount1Out
    }
    return amount0Out
  })()

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
  const priceX = BigNumber(tokenPriceX?.price || 0)
  const priceY = BigNumber(tokenPriceY?.price || 0)
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
    ? BigNumber(bFormatUnits(amountIn, tokenX?.decimals || 0)).multipliedBy(
        priceX,
      )
    : BigNumber(bFormatUnits(amountIn, tokenY?.decimals || 0)).multipliedBy(
        priceY,
      )

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
      amountIn: amountIn.toString(),
      amountOut: amountOut.toString(),
      swapForY,
      volumeUsd: volumeUsd.toString(),
      timestamp,
    },
  })

  const {
    hash: poolTxHash,
    lt,
    utime: poolUtime,
  } = payToNormalTrace.transaction
  const { protocolFeeOut } = calculateOutAmount({
    amountIn,
    hasRef: !!payToRef,
    lpFee: LP_FEE,
    protocolFee: PROTOCOL_FEE,
    refFee: REF_FEE,
    reserveIn: swapForY ? BigNumber(pool.reserveX) : BigNumber(pool.reserveY),
    reserveOut: swapForY ? BigNumber(pool.reserveY) : BigNumber(pool.reserveX),
  })
  const lpFeeAmount = amountIn.multipliedBy(LP_FEE).div(FEE_DIVIDER)
  const protocolFeeAmount = protocolFeeOut

  const referralFeeAmount = (function () {
    if (!payToRef) {
      return BigNumber(0)
    }
    const { amount0Out, amount1Out } = payToRef
    if (amount0Out.isZero()) {
      return amount1Out
    }
    return amount0Out
  })()

  const { asset0Delta, asset0Amount, asset1Delta, asset1Amount } =
    (function () {
      const assetOutAmount = amountOut
      const assetOutDelta = assetOutAmount
        .plus(protocolFeeAmount)
        .plus(referralFeeAmount)

      if (swapForY) {
        return {
          asset0Delta: amountIn,
          asset0Amount: amountIn,
          asset1Delta: -assetOutDelta,
          asset1Amount: -assetOutAmount,
        }
      } else {
        return {
          asset0Delta: -assetOutDelta,
          asset0Amount: -assetOutAmount,
          asset1Delta: amountIn,
          asset1Amount: amountIn,
        }
      }
    })()

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
      asset0Amount: asset0Amount.toString(),
      asset0Delta: asset0Delta.toString(),
      asset0Reserve: pool.reserveX,

      asset1Address: tokenYAddress,
      asset1Amount: asset1Amount.toString(),
      asset1Delta: asset1Delta.toString(),
      asset1Reserve: pool.reserveY,

      lpTokenDelta: '0', // always 0 for swap
      lpTokenSupply: pool.lpSupply, // TODO: check lpTSupply before or after

      lpFeeAmount: lpFeeAmount.toString(),
      protocolFeeAmount: protocolFeeAmount.toString(),
      referralFeeAmount: referralFeeAmount.toString(),

      walletAddress: senderAddress,
      walletTxLt: String(walletTrace.transaction.lt),
      walletTxHash: walletTrace.transaction.hash,
      walletTxTimestamp: new Date(
        walletTrace.transaction.utime * 1000,
      ).toISOString(),
    },
  })

  let reserveX = BigNumber(pool.reserveX)
  let reserveY = BigNumber(pool.reserveY)
  let collectedXProtocolFee = BigNumber(pool.collectedXProtocolFee)
  let collectedYProtocolFee = BigNumber(pool.collectedYProtocolFee)

  // !NOTE: Use amountOut, referralFeeAmount of block data, not simulated one.
  const out = amountOut.plus(protocolFeeAmount).plus(referralFeeAmount)

  if (swapForY) {
    reserveX = reserveX.plus(amountIn)
    reserveY = reserveY.minus(out)
    collectedYProtocolFee = collectedYProtocolFee.plus(protocolFeeAmount)
  } else {
    reserveX = reserveX.minus(out)
    reserveY = reserveY.plus(amountIn)
    collectedXProtocolFee = collectedXProtocolFee.plus(protocolFeeAmount)
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
