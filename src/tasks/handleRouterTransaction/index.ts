import { compact, map } from 'lodash'

import handleAddLiquidity from 'src/mappings/cpmm/handleAddLiquidity'
import handleExchange from 'src/mappings/cpmm/handleExchange'
import handlePoolCreated from 'src/mappings/cpmm/handlePoolCreated'
import handleRemoveLiquidity from 'src/mappings/cpmm/handleRemoveLiquidity'
import {
  checkTxHasOp,
  findOutMessage,
  findTx,
  getLpAccountTransactionWithCache,
  getPoolTransactionFromNextHash,
  getPoolTransactionFromPrevHash,
} from 'src/transactions'
import { ParsedTransaction } from 'src/types/ton-center'
import { warn } from 'src/utils/log'

import { OP } from './opCode'

const findBurnNotificationTxs = async ({
  routerTx,
}: {
  routerTx: ParsedTransaction
}) => {
  const {
    inMessage: routerInMessage,
    firstOutMessage: routerFirstOutMessages,
  } = routerTx
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

const findAddLiquidityTxs = async ({
  addLiquidityTx,
  poolAddress,
}: {
  addLiquidityTx: ParsedTransaction
  poolAddress: string
}) => {
  const lpAccountOutMessage = findOutMessage(
    addLiquidityTx,
    OP.CB_ADD_LIQUIDITY,
  )
  const poolTx2 = await getPoolTransactionFromPrevHash({
    poolAddress,
    inMessageHash: lpAccountOutMessage?.msg,
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

const findPoolCreatedTxs = async ({
  routerTx,
}: {
  routerTx: ParsedTransaction
}) => {
  const routerOutMessage = findOutMessage(routerTx, OP.PROVIDE_LP)
  const poolAddress = routerOutMessage?.info?.dest?.toString()
  const transferNotificationTx = routerTx
  if (!poolAddress) {
    warn('Empty poolAddress')
    return null
  }
  const poolTx = await getPoolTransactionFromPrevHash({
    poolAddress,
    inMessageHash: routerOutMessage?.msg,
    prevHashLt: routerTx.lt,
  })
  const matched = checkTxHasOp({
    tx: poolTx,
    inMessageOp: OP.PROVIDE_LP,
    outMessageOp: OP.ADD_LIQUIDITY,
  })
  const provideLpTx = matched ? poolTx : null
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

  const routerOutMessage2 = findOutMessage(provideLpTx, OP.ADD_LIQUIDITY)
  const lpAccountTx = await getLpAccountTransactionWithCache({
    lpAccountAddress,
    inMessageHash: routerOutMessage2?.msg,
    prevHashLt: provideLpTx.lt,
  })
  const matched2 = checkTxHasOp({
    tx: lpAccountTx,
    inMessageOp: OP.ADD_LIQUIDITY,
  })
  const addLiquidityTx = matched2 ? lpAccountTx : undefined

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

const findExchangeTxs = async ({
  routerTx,
  routerTxs,
}: {
  routerTx: ParsedTransaction
  routerTxs: ParsedTransaction[]
}) => {
  const transferNotificationTx = routerTx
  const routerOutMessage = findOutMessage(routerTx, OP.SWAP)
  const poolAddress = routerOutMessage?.info?.dest?.toString()
  if (!poolAddress) {
    warn('Empty poolAddress')
    return null
  }

  const poolTx = await getPoolTransactionFromPrevHash({
    poolAddress,
    inMessageHash: routerOutMessage?.msg,
    prevHashLt: routerTx.lt,
  })

  // Swap may have 'pay_to' for outMessage
  const matched = checkTxHasOp({
    tx: poolTx,
    inMessageOp: OP.SWAP,
  })
  const swapTx = matched ? poolTx : undefined

  // TODO: check case of 'hasRef' is true
  const swapOutMessages = swapTx?.outMessages
  const payToTxs = compact(
    map(swapOutMessages, (outMessage) =>
      findTx({
        txs: routerTxs,
        inMessageHash: outMessage?.msg || '',
        inMessageOp: OP.PAY_TO,
        outMessageOp: OP.TRANSFER,
      }),
    ),
  )
  return {
    transferNotificationTx,
    swapTx,
    payToTxs,
  }
}

const handleRouterTransaction = async ({
  routerTxs,
  routerTx,
  txsCount,
}: {
  routerTxs: ParsedTransaction[]
  routerTx: ParsedTransaction
  txsCount: number
}) => {
  const {
    inMessage: routerInMessage,
    firstOutMessage: routerFirstOutMessages,
  } = routerTx
  const routerOutMessageSwap = findOutMessage(routerTx, OP.SWAP)
  const routerOutMessageProvideLp = findOutMessage(routerTx, OP.PROVIDE_LP)
  const isProvideLp =
    routerInMessage?.opHex === OP.TRANSFER_NOTIFICATION &&
    !!routerOutMessageProvideLp
  const isSwap =
    routerInMessage?.opHex === OP.TRANSFER_NOTIFICATION &&
    !!routerOutMessageSwap
  const isPayTo = routerInMessage?.opHex === OP.PAY_TO
  if (isSwap) {
    const exchangeTxs = await findExchangeTxs({
      routerTx,
      routerTxs,
    })
    if (!exchangeTxs) {
      return false
    }
    const { transferNotificationTx, swapTx, payToTxs } = exchangeTxs
    console.log(`${txsCount}. Handle Exchange, swapTx: ${swapTx?.hashHex}`)
    await handleExchange({
      transferNotificationTx,
      swapTx,
      payToTxs,
    })
    return true
  } else if (isProvideLp) {
    const poolCreatedTxs = await findPoolCreatedTxs({
      routerTx,
    })
    if (!poolCreatedTxs) {
      return false
    }
    const { transferNotificationTx, provideLpTx, addLiquidityTx, poolAddress } =
      poolCreatedTxs

    const isPoolCreated =
      provideLpTx.oldStatus === 'non-existing' &&
      provideLpTx.endStatus === 'active'

    if (isPoolCreated) {
      console.log(
        `${txsCount}. Handle Pool Created, provideLpTx: ${provideLpTx.hashHex}`,
      )
      await handlePoolCreated({
        transferNotificationTx,
        provideLpTx,
        addLiquidityTx,
      })
      return true
    }

    const addLiquidityTxs = await findAddLiquidityTxs({
      addLiquidityTx,
      poolAddress,
    })
    if (!addLiquidityTxs) {
      return
    }
    const { cbAddLiquidityTx } = addLiquidityTxs

    if (cbAddLiquidityTx) {
      console.log(
        `${txsCount}. Handle Add Liquidity, provideLpTx: ${provideLpTx.hashHex}`,
      )
      await handleAddLiquidity({
        provideLpTx,
        addLiquidityTx,
        cbAddLiquidityTx,
      })
      return true
    }
    return false
  } else if (isPayTo) {
    // handle pay_to
    // pay_to maybe the consequence of swap or burn_notification
    // swap -> do nothing
    // burn_notification -> handle burn_notification

    const burnNotificationTxs = await findBurnNotificationTxs({
      routerTx,
    })
    if (!burnNotificationTxs) {
      return false
    }
    const { poolTx, burnNotificationTx } = burnNotificationTxs

    if (burnNotificationTx) {
      console.log(
        `${txsCount}. Handle Remove Liquidity, burnNotificationTx: ${burnNotificationTx.hashHex}`,
      )
      await handleRemoveLiquidity({
        burnNotificationTx,
      })
      return true
    }

    // log rest cases
    const isSwapPayTo = poolTx?.inMessage?.opHex === OP.SWAP
    const isCbRefundMe = poolTx?.inMessage?.opHex === OP.CB_REFUND_ME
    if (isSwapPayTo) {
      // console.log(
      //   `Unmatched Transaction - swap pay to, routerTx: ${routerTx?.hashHex}`,
      // )
    } else if (isCbRefundMe) {
      // console.log(
      //   `Unmatched Transaction - cb refund me, routerTx: ${routerTx?.hashHex}`,
      // )
    } else {
      logUnknownTransaction(routerTx)
    }
  } else {
    logUnknownTransaction(routerTx)
    return false
  }
}

// TODO: fill
const alreadyCheckedTxs = [] as string[]
const logUnknownTransaction = (tx: ParsedTransaction) => {
  const isAlreadyChecked = alreadyCheckedTxs.includes(tx.hashHex)
  const hasNFTTransfer = tx.inMessage?.opHex === OP.NFT_TRANSFER
  const hasTextComment = tx.inMessage?.opHex === OP.TEXT_COMMENT
  if (isAlreadyChecked) {
    console.log(`Already checked, tx: ${tx.hashHex}`)
  } else if (hasNFTTransfer) {
    console.log(`NFT Transfer, tx: ${tx.hashHex}`)
  } else if (hasTextComment) {
    console.log(`Text Comment, tx: ${tx.hashHex}`)
  } else {
    console.log(
      `Unkown Transaction \ntx.hashHex: ${tx.hashHex}, tx.lt: ${tx.lt}, tx.inMessage?.opHex: ${tx.inMessage?.opHex}, tx.outMessages?.[0]?.opHex: ${tx.outMessages?.[0]?.opHex}`,
    )
  }
}

export default handleRouterTransaction
