import { Cell } from '@ton/core'

const parseOrder = (message: Cell) => {
  const body = message.beginParse()
  const logCode = body.loadUint(32)
  const senderAddress = body.loadAddress().toString()
  const poolAddress = body.loadAddress().toString()
  const positionAddress = body.loadAddress().toString()
  const binId = body.loadUint(24)
  const orderForY = body.loadBoolean()
  const positionId = body.loadUint(32)
  const amountX = body.loadCoins()
  const amountY = body.loadCoins()

  return {
    logCode,
    senderAddress,
    poolAddress,
    positionAddress,
    binId,
    orderForY,
    positionId,
    amountX,
    amountY,
  }
}

export default parseOrder
