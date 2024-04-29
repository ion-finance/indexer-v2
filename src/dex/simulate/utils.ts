import { Token } from '@prisma/client'
import BigNumber from 'bignumber.js'

import prisma from 'src/clients/prisma'
import getLatestTokenPrices from 'src/query/getLatestTokenPrices'
import { isSameAddress } from 'src/utils/address'

import { FEE_DIVIDER } from './contant'

export const calculatePriceImpact = ({
  amountIn,
  reserveIn,
}: {
  amountIn: BigNumber
  reserveIn: BigNumber
}): number => {
  const priceImpact = amountIn
    .div(reserveIn.plus(amountIn))
    .multipliedBy(100)
    .toNumber()
  return priceImpact
}

export const calculateOutAmount = ({
  hasRef,
  amountIn,
  reserveIn,
  reserveOut,
  lpFee,
  protocolFee,
  refFee,
}: {
  hasRef: boolean
  amountIn: BigNumber
  reserveIn: BigNumber
  reserveOut: BigNumber
  lpFee: number
  protocolFee: number
  refFee: number
}): {
  out: BigNumber
  protocolFeeOut: BigNumber
  refFeeOut: BigNumber
} => {
  if (amountIn.lte(0)) {
    return {
      out: BigNumber(0),
      protocolFeeOut: BigNumber(0),
      refFeeOut: BigNumber(0),
    }
  }

  // const amountInWithFee = (amountIn * (FEE_DIVIDER - lpFee)) / FEE_DIVIDER
  // const baseOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee)
  // const protocolFeeOut = protocolFee > 0 ? Math.ceil((baseOut * protocolFee) / FEE_DIVIDER) : 0
  // const refFeeOut =
  //   hasRef && refFee > 0 ? Math.ceil((baseOut * refFee) / FEE_DIVIDER) : 0
  // const finalOut = baseOut - protocolFeeOut - refFeeOut

  const lpFeeNumber = new BigNumber(lpFee / FEE_DIVIDER)

  const amountInWithFee = amountIn.multipliedBy(BigNumber(1).minus(lpFeeNumber))
  const baseOut = amountInWithFee
    .multipliedBy(reserveOut)
    .div(reserveIn.plus(amountInWithFee))

  const protocolFeeOut =
    protocolFee > 0
      ? baseOut
          .multipliedBy(protocolFee)
          .div(FEE_DIVIDER)
          .integerValue(BigNumber.ROUND_CEIL)
      : BigNumber(0)

  const refFeeOut =
    hasRef && refFee > 0
      ? baseOut.multipliedBy(refFee).integerValue(BigNumber.ROUND_CEIL)
      : BigNumber(0)

  const finalOut = baseOut.minus(protocolFeeOut).minus(refFeeOut)

  return {
    out: finalOut,
    protocolFeeOut: protocolFeeOut,
    refFeeOut: refFeeOut,
  }
}

export const calculateInAmount = ({
  hasRef,
  amountOut,
  reserveIn,
  reserveOut,
  lpFee,
  protocolFee,
  refFee,
  slippageTolerance,
}: {
  hasRef: boolean
  amountOut: BigNumber
  reserveIn: BigNumber
  reserveOut: BigNumber
  lpFee: number
  protocolFee: number
  refFee: number
  slippageTolerance: number
}): BigNumber => {
  if (amountOut.lte(0)) {
    return BigNumber(Infinity)
  }

  const fee = hasRef ? protocolFee + refFee : protocolFee
  // const amountOutBeforeFee = (amountOut * FEE_DIVIDER) / (FEE_DIVIDER - fee)
  const amountOutBeforeFee = amountOut
    .multipliedBy(FEE_DIVIDER)
    .div(FEE_DIVIDER - fee)

  if (reserveOut.lte(amountOutBeforeFee)) {
    console.warn('Not enough reserve')
    return BigNumber(Infinity)
  }

  // const numerator = reserveIn * amountOutBeforeFee
  // const denominator =
  //   ((reserveOut - amountOutBeforeFee) * (FEE_DIVIDER - lpFee)) / FEE_DIVIDER
  // const amountInAfterFee = numerator / denominator + 1
  // const amountIn = (amountInAfterFee * FEE_DIVIDER) / (FEE_DIVIDER - lpFee)
  // const amountInWithSlippage = amountIn * (1 + slippageTolerance) // slippage applied to amountIn
  const numerator = reserveIn.multipliedBy(amountOutBeforeFee)
  const denominator = reserveOut
    .minus(amountOutBeforeFee)
    .multipliedBy(FEE_DIVIDER - lpFee)
    .div(FEE_DIVIDER)
  const amountInAfterFee = numerator.div(denominator).plus(1)
  const amountIn = amountInAfterFee
    .multipliedBy(FEE_DIVIDER)
    .div(FEE_DIVIDER - lpFee)
  const amountInWithSlippage = amountIn.multipliedBy(1 + slippageTolerance)
  return amountInWithSlippage
}

export async function calculateFeeInNanotons({
  offerAmount,
  offerToken,
  feePercent,
}: {
  offerAmount: BigNumber
  offerToken: Token
  feePercent: number
}): Promise<BigNumber> {
  const tokenPrices = await getLatestTokenPrices()
  const TON_WALLET_ADDRESS = process.env.TON_WALLET_ADDRESS as string
  const isTon = isSameAddress(offerToken.id, TON_WALLET_ADDRESS)

  if (isTon) {
    return offerAmount
      .multipliedBy(feePercent)
      .div(100)
      .integerValue(BigNumber.ROUND_FLOOR)
  }

  const tonPrice = tokenPrices.find((tokenPrice) =>
    isSameAddress(tokenPrice.id, TON_WALLET_ADDRESS),
  )
  const offerTokenPrice = tokenPrices.find((tokenPrice) =>
    isSameAddress(tokenPrice.id, offerToken.id),
  )
  if (!offerTokenPrice || !tonPrice) {
    console.warn('Token price not found.')
    return BigNumber(0)
  }
  const offerTokenPriceByTon =
    Number(offerTokenPrice.price) / Number(tonPrice.price)
  return offerAmount
    .multipliedBy(feePercent)
    .multipliedBy(offerTokenPriceByTon)
    .div(100)
}
