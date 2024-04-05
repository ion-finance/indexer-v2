import { Cell } from '@ton/core'

const parseRemoveLiquidity = (message: Cell) => {
  const body = message.beginParse()
  body.loadUint(32) // skip log code
  const senderAddress = body.loadAddress().toString()
  const amountX = body.loadCoins().toString()
  const amountY = body.loadCoins().toString()
  const burned = body.loadCoins().toString()

  return {
    senderAddress,
    amountX,
    amountY,
    burned,
  }
}

export default parseRemoveLiquidity
