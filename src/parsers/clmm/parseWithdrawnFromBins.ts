import { Dictionary, Cell } from '@ton/core'

const parseWithdrawnFromBins = (message: Cell) => {
  const body = message.beginParse()
  const logCode = body.loadUint(32)
  const senderAddress = body.loadAddress().toString()
  const receiverAddress = body.loadAddress().toString()
  const withdrawn = body.loadDict(Dictionary.Keys.Uint(24), {
    serialize: (src: { amountX: bigint; amountY: bigint }, builder) => {
      builder.storeCoins(src.amountX).storeCoins(src.amountY)
    },
    parse: (src) => {
      const amountX = src.loadCoins()
      const amountY = src.loadCoins()
      return { amountX, amountY }
    },
  })

  return {
    logCode,
    senderAddress,
    receiverAddress,
    withdrawn,
  }
}

export default parseWithdrawnFromBins
