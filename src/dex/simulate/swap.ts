import { Token } from '@prisma/client'
import BigNumber from 'bignumber.js'

import prisma from 'src/clients/prisma'

import { LP_FEE, PROTOCOL_FEE, REF_FEE } from './contant'
import { SwapSimulateRequest, SwapSimulateResponse } from './type'
import {
  calculateFeeInNanotons,
  calculateOutAmount,
  calculatePriceImpact,
} from './utils'

export async function simulateSwap(
  swapData: SwapSimulateRequest,
): Promise<SwapSimulateResponse | null> {
  const routerAddress = process.env.ROUTER_ADDRESS || ''
  const {
    offerAddress,
    askAddress,
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

  // askUnits > 0 ? Math.floor(askUnits * (1 - slippageTolerance)) : 0
  // const swapRate = amountIn > 0 ? askUnits / amountIn : 0
  // const feePercent = askUnits > 0 ? (protocolFeeOut + refFeeOut) / askUnits : 0
  const minAskUnits = askUnits.gt(0)
    ? askUnits
        .multipliedBy(1 - slippageTolerance)
        .integerValue(BigNumber.ROUND_FLOOR)
    : BigNumber(0)

  const swapRate = amountIn.gt(0) ? askUnits.div(amountIn) : BigNumber(0)
  const feePercent = askUnits.gt(0)
    ? protocolFeeOut.plus(refFeeOut).div(askUnits)
    : BigNumber(0)

  const offerToken = swapForY ? tokenX : tokenY
  const feeNanotons = await calculateFeeInNanotons({
    offerAmount: amountIn,
    offerToken,
    feePercent: feePercent.toNumber(),
  })

  return {
    askAddress,
    askUnits: askUnits.toString(),
    feeAddress: askAddress,
    feePercent: feePercent.toNumber(),
    // feeUnits: protocolFeeOut + refFeeOut,
    feeUnits: protocolFeeOut.plus(refFeeOut).toString(),
    minAskUnits: minAskUnits.toString(),
    offerAddress,
    offerUnits: amountIn.toString(),
    poolAddress: pool.id,
    priceImpact,
    routerAddress,
    slippageTolerance,
    swapRate: swapRate.toNumber(),
    tonFeeUnits: feeNanotons.toString(),
  }
}
