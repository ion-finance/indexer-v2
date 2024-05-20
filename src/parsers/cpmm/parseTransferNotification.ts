import { Cell } from '@ton/core'

import { bigIntToBigNumber } from 'src/utils/bigNumber'

export const parseTransferNotification = (cell: Cell) => {
  const body = cell.beginParse()
  const op = body.loadUint(32)
  const queryId = body.loadUint(64)
  const jettonAmount = body.loadCoins()
  const fromUser = body.loadAddress().toString()
  const c = body.loadRef()
  const cs = c.beginParse()
  const transferredOp = cs.loadUint(32)
  const tokenWallet1 = cs.loadAddress().toString() // router jetton wallet
  const minLpOut = cs.loadCoins()

  return {
    op,
    queryId,
    jettonAmount: bigIntToBigNumber(jettonAmount),
    fromUser,
    transferredOp,
    tokenWallet1,
    minLpOut: bigIntToBigNumber(minLpOut),
  }
}