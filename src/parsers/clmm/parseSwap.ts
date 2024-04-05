import { Cell } from '@ton/core'

const parseSwap = (message: Cell) => {
  const body = message.beginParse()
  const logCode = body.loadUint(32)
  const senderAddress = body.loadAddress().toString()
  const receiverAddress = body.loadAddress().toString()
  const activeBinId = body.loadUint(24)
  const amountIn = body.loadCoins()
  const amountOut = body.loadCoins()
  const swapForY = body.loadUint(1) ? true : false

  return {
    logCode,
    senderAddress,
    receiverAddress,
    activeBinId,
    amountIn,
    amountOut,
    swapForY,
  }
}

export default parseSwap
