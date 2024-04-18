import { Token } from '@prisma/client'
import { has } from 'lodash'

import prisma from 'src/clients/prisma'
import { isSameAddress } from 'src/utils/address'

import { FEE_DIVIDER, LP_FEE } from './contant'

export const calculatePriceImpact = ({
  amountIn,
  reserveIn,
}: {
  amountIn: number
  reserveIn: number
}): number => {
  const priceImpact = (amountIn / (reserveIn + amountIn)) * 100
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
  amountIn: number
  reserveIn: number
  reserveOut: number
  lpFee: number
  protocolFee: number
  refFee: number
}): {
  out: number
  protocolFeeOut: number
  refFeeOut: number
} => {
  if (amountIn <= 0) {
    return {
      out: 0,
      protocolFeeOut: 0,
      refFeeOut: 0,
    }
  }

  const amountInWithFee = (amountIn * (FEE_DIVIDER - lpFee)) / FEE_DIVIDER
  const baseOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee)

  const protocolFeeOut =
    protocolFee > 0 ? Math.ceil((baseOut * protocolFee) / FEE_DIVIDER) : 0
  const refFeeOut =
    hasRef && refFee > 0 ? Math.ceil((baseOut * refFee) / FEE_DIVIDER) : 0

  const finalOut = baseOut - protocolFeeOut - refFeeOut

  return {
    out: Math.floor(finalOut),
    protocolFeeOut: Math.floor(protocolFeeOut),
    refFeeOut: Math.floor(refFeeOut),
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
  amountOut: number
  reserveIn: number
  reserveOut: number
  lpFee: number
  protocolFee: number
  refFee: number
  slippageTolerance: number
}): number => {
  if (amountOut <= 0) {
    return Number(Infinity)
  }
  // amountOut should be large for protocolFee, refFee
  const fee = hasRef ? protocolFee + refFee : protocolFee
  const amountOutBeforeFee = (amountOut * FEE_DIVIDER) / (FEE_DIVIDER - fee)

  if (reserveOut <= amountOutBeforeFee) {
    console.warn('Not enough reserve')
    return Number(Infinity)
  }

  const numerator = reserveIn * amountOutBeforeFee
  const denominator =
    ((reserveOut - amountOutBeforeFee) * (FEE_DIVIDER - lpFee)) / FEE_DIVIDER

  const amountInAfterFee = numerator / denominator + 1
  const amountIn = (amountInAfterFee * FEE_DIVIDER) / (FEE_DIVIDER - lpFee)

  const amountInWithSlippage = amountIn * (1 + slippageTolerance) // slippage applied to amountIn

  return Math.floor(amountInWithSlippage)
}

export async function calculateFeeInNanotons({
  offerAmount,
  offerToken,
  feePercent,
}: {
  offerAmount: number
  offerToken: Token
  feePercent: number
}): Promise<number> {
  const tokenPrices = await prisma.tokenPrice.findMany()
  const TON_WALLET_ADDRESS = process.env.TON_WALLET_ADDRESS as string
  const isTon = isSameAddress(offerToken.id, TON_WALLET_ADDRESS)

  if (isTon) {
    return Math.floor((offerAmount * feePercent) / 100)
  }

  const tonPrice = tokenPrices.find((tokenPrice) =>
    isSameAddress(tokenPrice.id, TON_WALLET_ADDRESS),
  )
  const offerTokenPrice = tokenPrices.find((tokenPrice) =>
    isSameAddress(tokenPrice.id, offerToken.id),
  )
  if (!offerTokenPrice || !tonPrice) {
    console.warn('Token price not found.')
    return 0
  }
  const offerTokenPriceByTon =
    Number(offerTokenPrice.price) / Number(tonPrice.price)
  return (offerAmount * feePercent * offerTokenPriceByTon) / 100
}
