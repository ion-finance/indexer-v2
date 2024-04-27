import BigNumber from 'bignumber.js'

export const bigIntToBigNumber = (b?: bigint): BigNumber => {
  if (!b) {
    return new BigNumber(0)
  }
  return new BigNumber(b.toString())
}

export const bFormatUnits = (b: BigNumber, decimals: number): BigNumber => {
  return b.dividedBy(new BigNumber(10).pow(decimals))
}
export const bParseUnits = (b: BigNumber, decimals: number): BigNumber => {
  return b.multipliedBy(new BigNumber(10).pow(decimals))
}
