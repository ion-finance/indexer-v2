import { Cell } from '@ton/core'

import { bigIntToBigNumber } from 'src/utils/bigNumber'

const parseExchange = (message: Cell) => {
  const body = message.beginParse()
  body.loadUint(32) // skip log code
  const senderAddress = body.loadAddress().toString()
  const receiverAddress = body.loadAddress().toString()
  const amountIn = body.loadCoins()
  const amountOut = body.loadCoins()
  const swapForY = body.loadUint(1) ? true : false

  return {
    senderAddress,
    receiverAddress,
    amountIn: bigIntToBigNumber(amountIn),
    amountOut: bigIntToBigNumber(amountOut),
    swapForY,
  }
}

export default parseExchange
