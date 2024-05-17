import { Cell } from '@ton/core'

import { bigIntToBigNumber } from 'src/utils/bigNumber'

export const parseSwap = (cell: Cell) => {
  const body = cell.beginParse()
  const op = body.loadUint(32)
  const queryId = body.loadUint(64)
  const toAddress = body.loadAddress().toString() //  == pay_to's to_address -> wallet v4
  const senderAddress = body.loadAddress().toString() // router jetton wallet
  const jettonAmount = body.loadCoins()
  const minOut = body.loadCoins()
  const hasRef = body.loadUint(1)

  return {
    op,
    queryId,
    toAddress,
    senderAddress,
    jettonAmount: bigIntToBigNumber(jettonAmount),
    minOut: bigIntToBigNumber(minOut),
    hasRef,
  }
}
