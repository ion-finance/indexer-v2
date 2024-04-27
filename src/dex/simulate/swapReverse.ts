import { Token } from '@prisma/client'
import BigNumber from 'bignumber.js'

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

  const reserveX = BigNumber(pool.reserveX)
  const reserveY = BigNumber(pool.reserveY)
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

  // const swapRate = offerUnits > 0 ? units / offerUnits : 0
  // const protocolFeeOut = (amountOut * PROTOCOL_FEE) / FEE_DIVIDER
  // const refFeeOut = hasRef ? (amountOut * REF_FEE) / FEE_DIVIDER : 0
  // const feePercent =
  //   minAskUnits > 0
  //     ? (protocolFeeOut + refFeeOut) / (minAskUnits * (1 + slippageTolerance))
  //     : 0

  const swapRate = offerUnits.gt(0) ? units.div(offerUnits) : BigNumber(0)
  const protocolFeeOut = amountOut.multipliedBy(PROTOCOL_FEE).div(FEE_DIVIDER)
  const refFeeOut = hasRef
    ? amountOut.multipliedBy(REF_FEE).div(FEE_DIVIDER)
    : BigNumber(0)
  const feePercent = minAskUnits.gt(0)
    ? protocolFeeOut
        .plus(refFeeOut)
        .div(minAskUnits.multipliedBy(1 + slippageTolerance))
    : BigNumber(0)
  const offerToken = swapForY ? tokenX : tokenY

  const feeNanotons = await calculateFeeInNanotons({
    offerAmount: offerUnits,
    offerToken,
    feePercent: feePercent.toNumber(),
  })

  return {
    askAddress: askAddress,
    askUnits: minAskUnits.toString(),
    feeAddress: askAddress,
    feePercent: feePercent.toNumber(),
    feeUnits: protocolFeeOut.plus(refFeeOut).toString(),
    minAskUnits: minAskUnits.toString(),
    offerAddress: offerAddress,
    offerUnits: offerUnits.toString(),
    poolAddress: pool.id,
    priceImpact: priceImpact,
    routerAddress,
    slippageTolerance: slippageTolerance,
    swapRate: swapRate.toNumber(),
    tonFeeUnits: feeNanotons.toString(),
  }
}
