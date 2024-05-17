import { Cell } from '@ton/core'

import { bigIntToBigNumber } from 'src/utils/bigNumber'

export const parseMint = (cell: Cell) => {
  const body = cell.beginParse()
  const op = body.loadUint(32)
  const queryId = body.loadUint(64)
  const amount = body.loadCoins()
  const poolAddress = body.loadAddress().toString()
  const to = body.loadMaybeAddress()

  return {
    op,
    queryId,
    amount: bigIntToBigNumber(amount),
    poolAddress,
    to,
  }
}
