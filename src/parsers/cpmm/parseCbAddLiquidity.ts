import { Cell } from '@ton/core'

import { bigIntToBigNumber } from 'src/utils/bigNumber'
export const parseCbAddLiquidity = (raw_body: string) => {
  const message = Cell.fromBoc(Buffer.from(raw_body, 'hex'))[0]
  const body = message.beginParse()
  const op = body.loadUint(32)
  const queryId = body.loadUint(64)

  const amount0 = body.loadCoins()
  const amount1 = body.loadCoins()
  const userAddress = body.loadAddress().toString()
  const minLpOut = body.loadCoins()

  return {
    op,
    queryId,
    amount0: bigIntToBigNumber(amount0),
    amount1: bigIntToBigNumber(amount1),
    userAddress,
    minLpOut: bigIntToBigNumber(minLpOut),
  }
}
