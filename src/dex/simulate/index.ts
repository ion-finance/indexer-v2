import prisma from '../../clients/prisma'
import { Token } from '@prisma/client'
import {
  calculateFeeInNanotons,
  calculateOutAmount,
  calculatePriceImpact,
} from './utils'
import { LP_FEE, PROTOCOL_FEE, REF_FEE } from './contant'

interface SwapSimulateRequest {
  offerAddress: string
  askAddress: string
  units: number
  slippageTolerance: number // 0.001 is 0.1%
  referralAddress?: string
}

interface SwapSimulateResponse {
  askAddress: string
  askUnits: number
  feeAddress: string
  feePercent: number
  feeUnits: number
  minAskUnits: number
  offerAddress: string
  offerUnits: number
  poolAddress: string
  priceImpact: number
  routerAddress: string
  slippageTolerance: number
  swapRate: number
  tonFeeUnits: number
}

async function simulateSwap(
  swapData: SwapSimulateRequest,
): Promise<SwapSimulateResponse | null> {
  const routerAddress = process.env.ROUTER_ADDRESS || ''
  const {
    askAddress,
    offerAddress,
    slippageTolerance,
    units,
    referralAddress,
  } = swapData
  const pool = await Promise.race([
    prisma.pool.findFirst({
      where: {
        tokenXAddress: askAddress,
        tokenYAddress: offerAddress,
      },
    }),
    prisma.pool.findFirst({
      where: {
        tokenXAddress: offerAddress,
        tokenYAddress: askAddress,
      },
    }),
  ])
  if (!pool) {
    console.warn('Pool not found.')
    return null
  }

  const tokens = await prisma.token.findMany()
  const tokenX = tokens.find((token: Token) => token.id === pool.tokenXAddress)
  const tokenY = tokens.find((token: Token) => token.id === pool.tokenYAddress)
  if (!tokenX || !tokenY) {
    console.warn('Token not found.')
    return null
  }

  const reserveX = Number(pool.reserveX)
  const reserveY = Number(pool.reserveY)
  const amountIn = units
  const hasRef = !!referralAddress
  const swapForY = pool.tokenXAddress === offerAddress
  const [reserveIn, reserveOut] = swapForY
    ? [reserveX, reserveY]
    : [reserveY, reserveX]

  const {
    out: askUnits,
    protocolFeeOut,
    refFeeOut,
  } = calculateOutAmount({
    amountIn,
    hasRef,
    lpFee: LP_FEE,
    protocolFee: PROTOCOL_FEE,
    refFee: REF_FEE,
    reserveIn,
    reserveOut,
  })

  const priceImpact = calculatePriceImpact({
    amountIn,
    reserveIn,
  })

  const minAskUnits =
    askUnits > 0 ? Math.floor(askUnits * (1 - slippageTolerance)) : 0
  const swapRate = amountIn > 0 ? askUnits / amountIn : 0
  const feePercent = askUnits > 0 ? (protocolFeeOut + refFeeOut) / askUnits : 0

  const offerToken = swapForY ? tokenX : tokenY
  const feeNanotons = await calculateFeeInNanotons({
    offerAmount: amountIn,
    offerToken,
    feePercent,
  })

  return {
    askAddress: askAddress,
    askUnits: askUnits,
    feeAddress: askAddress,
    feePercent: feePercent,
    feeUnits: protocolFeeOut + refFeeOut,
    minAskUnits: minAskUnits,
    offerAddress: offerAddress,
    offerUnits: amountIn,
    poolAddress: pool.id,
    priceImpact: priceImpact,
    routerAddress,
    slippageTolerance: slippageTolerance,
    swapRate: swapRate,
    tonFeeUnits: feeNanotons,
  }
}
