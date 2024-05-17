import { Cell } from '@ton/core'

import { bigIntToBigNumber } from 'src/utils/bigNumber'

export const parsePayTo = (raw_body: string) => {
  const message = Cell.fromBoc(Buffer.from(raw_body, 'hex'))[0]
  const body = message.beginParse()
  const op = body.loadUint(32)
  const queryId = body.loadUint(64)
  const toAddress = body.loadAddress().toString() // == swap's to_address -> wallet v4
  const exitCode = body.loadUint(32)
  const hasMore = body.loadUint(0)
  const ref = body.loadRef().beginParse()
  const amount0Out = ref.loadCoins()
  const token0Address = ref.loadAddress().toString() // router jetton wallet
  const amount1Out = ref.loadCoins()
  const token1Address = ref.loadAddress().toString()

  return {
    op,
    queryId,
    toAddress,
    exitCode,
    hasMore,
    amount0Out: bigIntToBigNumber(amount0Out),
    token0Address,
    amount1Out: bigIntToBigNumber(amount1Out),
    token1Address,
  }
}
