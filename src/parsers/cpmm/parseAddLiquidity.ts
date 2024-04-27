import { Cell } from '@ton/core'

import { bigIntToBigNumber } from 'src/utils/bigNumber'

const parseAddLiquidity = (message: Cell) => {
  const body = message.beginParse()
  body.loadUint(32) // skip log code
  const senderAddress = body.loadAddress().toString()
  const amountX = body.loadCoins()
  const amountY = body.loadCoins()
  const minted = body.loadCoins()

  return {
    senderAddress,
    amountX: bigIntToBigNumber(amountX),
    amountY: bigIntToBigNumber(amountY),
    minted: bigIntToBigNumber(minted),
  }
}

export default parseAddLiquidity
