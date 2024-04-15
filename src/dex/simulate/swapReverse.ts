import { Token } from '@prisma/client'

import prisma from 'src/clients/prisma'

import { FEE_DIVIDER, LP_FEE, PROTOCOL_FEE, REF_FEE } from './contant'
import { SwapSimulateRequest, SwapSimulateResponse } from './type'
import {
  calculateFeeInNanotons,
  calculateInAmount,
  calculatePriceImpact,
} from './utils'

export async function simulateSwapReverse(
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
  const pool = await prisma.pool.findFirst({
    where: {
      OR: [
        {
          AND: [{ tokenXAddress: askAddress }, { tokenYAddress: offerAddress }],
        },
        {
          AND: [{ tokenXAddress: offerAddress }, { tokenYAddress: askAddress }],
        },
      ],
    },
  })
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
  const amountOut = units
  const hasRef = !!referralAddress
  const swapForY = pool.tokenXAddress === offerAddress
  const [reserveIn, reserveOut] = swapForY
    ? [reserveX, reserveY]
    : [reserveY, reserveX]

  const offerUnits = calculateInAmount({
    hasRef,
    amountOut,
    reserveIn,
    reserveOut,
    lpFee: LP_FEE,
    protocolFee: PROTOCOL_FEE,
    refFee: REF_FEE,
    slippageTolerance,
  })

  const priceImpact = calculatePriceImpact({
    amountIn: offerUnits,
    reserveIn,
  })

  const minAskUnits = units

  const swapRate = offerUnits > 0 ? units / offerUnits : 0

  // TODO: check
  const protocolFeeOut =
    amountOut * (FEE_DIVIDER / (FEE_DIVIDER - PROTOCOL_FEE)) * PROTOCOL_FEE
  const refFeeOut =
    amountOut * (FEE_DIVIDER / (FEE_DIVIDER - REF_FEE)) * REF_FEE
  const feePercent =
    minAskUnits > 0 ? (protocolFeeOut + refFeeOut) / minAskUnits : 0

  const offerToken = swapForY ? tokenX : tokenY
  const feeNanotons = await calculateFeeInNanotons({
    offerAmount: offerUnits,
    offerToken,
    feePercent,
  })

  return {
    askAddress: askAddress,
    askUnits: minAskUnits,
    feeAddress: askAddress,
    feePercent: feePercent,
    feeUnits: protocolFeeOut + refFeeOut,
    minAskUnits: minAskUnits,
    offerAddress: offerAddress,
    offerUnits: offerUnits,
    poolAddress: pool.id,
    priceImpact: priceImpact,
    routerAddress,
    slippageTolerance: slippageTolerance,
    swapRate: swapRate,
    tonFeeUnits: feeNanotons,
  }
}
