import BigNumber from 'bignumber.js'

export type SwapSimulateRequest = {
  offerAddress: string
  askAddress: string
  units: BigNumber
  slippageTolerance: number // 0.001 is 0.1%
  referralAddress?: string
}

export type SwapSimulateResponse = {
  askAddress: string
  askUnits: string
  feeAddress: string
  feePercent: number
  feeUnits: string
  minAskUnits: string
  offerAddress: string
  offerUnits: string
  poolAddress: string
  priceImpact: number
  routerAddress: string
  slippageTolerance: number
  swapRate: number
  tonFeeUnits: string
}
