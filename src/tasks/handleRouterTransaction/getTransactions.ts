import { compact } from 'lodash'

import {
  checkTxHasOp,
  findOutMessageWithOp,
  getLpAccountTransactionWithCache,
  getPoolTransactionFromNextHash,
  getPoolTransactionFromPrevHash,
  getRouterTransactionFromPrevHash,
} from 'src/transactions'
import { ParsedTransaction } from 'src/types/ton-center'
import awaitMap from 'src/utils/awaitMap'
import { warn } from 'src/utils/log'

import { OP } from './opCode'

export const findBurnNotificationTxs = async ({
  routerTx,
}: {
  routerTx: ParsedTransaction
  toLt?: string
}) => {
  const { inMessage: routerInMessage } = routerTx
  const poolAddress = routerInMessage?.info?.src?.toString()
  if (!poolAddress) {
    warn('Empty poolAddress in pay to')
    return null
  }
  const poolTx = await getPoolTransactionFromNextHash({
    poolAddress,
    outMessageHash: routerInMessage?.msg,
    nextHashLt: routerTx.lt,
  })
  const matched4 = checkTxHasOp({
    tx: poolTx,
    inMessageOp: OP.BURN_NOTIFICATION,
    outMessageOp: OP.PAY_TO,
  })
  const burnNotificationTx = matched4 ? poolTx : null
  return {
    poolTx,
    burnNotificationTx,
  }
}

export const findAddLiquidityTxs = async ({
  addLiquidityTx,
  poolAddress,
  toLt,
}: {
  addLiquidityTx: ParsedTransaction
  poolAddress: string
  toLt?: string
}) => {
  const cbAddLiquidityMessage = findOutMessageWithOp(
    addLiquidityTx,
    OP.CB_ADD_LIQUIDITY,
  )
  const poolTx2 = await getPoolTransactionFromPrevHash({
    poolAddress,
    toLt,
    inMessageHash: cbAddLiquidityMessage?.msg,
    prevHashLt: addLiquidityTx.lt,
  })
  const matched3 = checkTxHasOp({
    tx: poolTx2,
    inMessageOp: OP.CB_ADD_LIQUIDITY,
    outMessageOp: OP.INTERNAL_TRANSFER,
  })
  const cbAddLiquidityTx = matched3 ? poolTx2 : null

  return {
    cbAddLiquidityTx,
  }
}

export const findPoolCreatedTxs = async ({
  routerTx,
  toLt,
}: {
  routerTx: ParsedTransaction
  toLt?: string
}) => {
  const provideLpMessage = findOutMessageWithOp(routerTx, OP.PROVIDE_LP)
  const poolAddress = provideLpMessage?.info?.dest?.toString()
  const transferNotificationTx = routerTx

  if (!poolAddress) {
    warn('Empty poolAddress')
    return null
  }
  const poolTx = await getPoolTransactionFromPrevHash({
    poolAddress,
    toLt,
    inMessageHash: provideLpMessage?.msg,
    prevHashLt: routerTx.lt,
  })
  const isValid = checkTxHasOp({
    tx: poolTx,
    inMessageOp: OP.PROVIDE_LP,
    outMessageOp: OP.ADD_LIQUIDITY,
  })
  const provideLpTx = isValid ? poolTx : null
  if (!provideLpTx) {
    console.log(
      `No provideLpTx, routerTx:${routerTx.hashHex}, poolTx:${poolTx?.hashHex}`,
    )
    return null
  }

  const lpAccountAddress = provideLpTx.outMessages?.[0]?.info?.dest?.toString()
  if (!lpAccountAddress) {
    warn('Empty lpAccountAddress')
    return null
  }

  const addLiquidityMessage = findOutMessageWithOp(
    provideLpTx,
    OP.ADD_LIQUIDITY,
  )
  const lpAccountTx = await getLpAccountTransactionWithCache({
    lpAccountAddress,
    inMessageHash: addLiquidityMessage?.msg,
    prevHashLt: provideLpTx.lt,
    toLt,
  })
  const isValid2 = checkTxHasOp({
    tx: lpAccountTx,
    inMessageOp: OP.ADD_LIQUIDITY,
  })
  const addLiquidityTx = isValid2 ? lpAccountTx : undefined

  if (!addLiquidityTx) {
    warn('No addLiquidityTx')
    return null
  }

  return {
    poolAddress,
    transferNotificationTx,
    provideLpTx,
    addLiquidityTx,
  }
}

export const findExchangeTxs = async ({
  routerTx,
  routerTxs,
  toLt,
}: {
  routerTx: ParsedTransaction
  routerTxs: ParsedTransaction[]
  toLt?: string
}) => {
  const transferNotificationTx = routerTx
  const swapMessage = findOutMessageWithOp(routerTx, OP.SWAP)
  const poolAddress = swapMessage?.info?.dest?.toString()
  if (!poolAddress) {
    warn('Empty poolAddress')
    return null
  }

  const poolTx = await getPoolTransactionFromPrevHash({
    poolAddress,
    inMessageHash: swapMessage?.msg,
    prevHashLt: routerTx.lt,
    toLt,
  })
  if (!poolTx) {
    warn('No poolTx')
    return
  }

  const isValid = checkTxHasOp({
    tx: poolTx,
    inMessageOp: OP.SWAP,
  })
  const swapTx = isValid ? poolTx : null
  if (!swapTx?.outMessages) {
    warn('No swapTx outMessages')
    return
  }

  const swapOutMessages = swapTx.outMessages
  const payToTxs = compact(
    await awaitMap(swapOutMessages, async (swapOutMessage) => {
      const tx = await getRouterTransactionFromPrevHash({
        toLt,
        inMessageHash: swapOutMessage.msg,
      })
      const isValid = checkTxHasOp({
        tx,
        inMessageOp: OP.PAY_TO,
        outMessageOp: OP.TRANSFER,
      })
      return isValid ? tx : null
    }),
  )

  return {
    transferNotificationTx,
    swapTx,
    payToTxs,
  }
}
