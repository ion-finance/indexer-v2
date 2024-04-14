export type SwapSimulateRequest = {
  offerAddress: string
  askAddress: string
  units: number
  slippageTolerance: number // 0.001 is 0.1%
  referralAddress?: string
}

export type SwapSimulateResponse = {
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
