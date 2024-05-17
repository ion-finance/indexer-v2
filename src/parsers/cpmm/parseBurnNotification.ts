import { Cell } from '@ton/core'

import { bigIntToBigNumber } from 'src/utils/bigNumber'

export const parseBurnNotification = (raw_body: string) => {
  const message = Cell.fromBoc(Buffer.from(raw_body, 'hex'))[0]
  const body = message.beginParse()
  const op = body.loadUint(32)
  const queryId = body.loadUint(64)

  const jettonAmount = body.loadCoins()
  const fromAddress = body.loadAddress().toString()
  const responseAddress = body.loadAddress().toString()

  return {
    op,
    queryId,
    jettonAmount: bigIntToBigNumber(jettonAmount),
    fromAddress,
    responseAddress,
  }
}
