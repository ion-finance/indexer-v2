import { Cell } from '@ton/core'

import { OP } from 'src/tasks/handleEvent/opCode'
import { bigIntToBigNumber } from 'src/utils/bigNumber'

export const parseBurnNotification = (cell: Cell) => {
  const body = cell.beginParse()
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

export const parseCbAddLiquidity = (cell: Cell) => {
  const body = cell.beginParse()
  const op = body.loadUint(32)
  const queryId = body.loadUint(64)

  const amount0 = body.loadCoins()
  const amount1 = body.loadCoins()
  const userAddress = body.loadAddress().toString()
  const minLpOut = body.loadCoins()

  return {
    op,
    queryId,
    amount0: bigIntToBigNumber(amount0),
    amount1: bigIntToBigNumber(amount1),
    userAddress,
    minLpOut: bigIntToBigNumber(minLpOut),
  }
}

export const parseMint = (cell: Cell) => {
  const body = cell.beginParse()
  const op = body.loadUint(32)
  const queryId = body.loadUint(64)
  const amount = body.loadCoins()
  const poolAddress = body.loadAddress().toString()
  const to = body.loadMaybeAddress()

  return {
    op,
    queryId,
    amount: bigIntToBigNumber(amount),
    poolAddress,
    to,
  }
}

export const parsePayTo = (cell: Cell) => {
  const body = cell.beginParse()
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

const parse = (cell: Cell) => {
  const body = cell.beginParse()
  const op = body.loadUint(32) as keyof typeof OP
  switch (op) {
    case OP.BURN_NOTIFICATION:
      return parseBurnNotification(cell)
    case OP.PAY_TO:
      return parsePayTo(cell)
    case OP.SWAP:
      return parseSwap(cell)
    case OP.TRANSFER_NOTIFICATION:
      return parseTransferNotification(cell)
    case OP.INTERNAL_TRANSFER:
      return parseMint(cell)
    case OP.CB_ADD_LIQUIDITY:
      return parseCbAddLiquidity(cell)
  }
}
