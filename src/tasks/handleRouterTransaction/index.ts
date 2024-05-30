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
        `${txsCount}. Handle Remove Liquidity, burnNotificationTx: ${burnNotificationTx.hashHex}, poolTx: ${poolTx?.hashHex}`,
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
const alreadyCheckedTxs = [
  '438f3d8122c3b96a035fc68a9fa9e720afae0811d9e339b76bba4c77abd74fee', //router init
  'b1fe8b5a5fbaa9274ac0510849040e8e5fb87d9bf2bd1cabcb35648c9b27ca7a', // exit code 87
  'a9f1dc95e4f352ddd8671e220eb17cb022cb390735865a204c824d21aff0a6f2', //multisend
  '6a044aef1a76514fb67c3bb0a12124b3229ce677b920e9343f64b53fb2ca710b', // exit code 87
  'd60edec3cc9b6d1d0cae614013f7d541c494d01fe60817776724093b908ef54b', // exit code 9
  '0bf58db87a2eac5287df6624deb2a059b65a09f551472adcdf67941b044b687d', // exit code 9
  '4ed90de2cdc544dea283889c6fd5134506e0e8924ec9d8c910be9f4980d498f2', // exit code 9
  '2c67c938e360c9149fbb24eb5c36c46867ff64df957e57a98503f6dca3d656d7', // exit code 65535
  '32f95a8f52345a71c789bcb50ce9142761094d6b4218f3ac165d80fd4a920d91', // exit code 9
  '8d500b78be2a7a6ea51e6eaf16219f515d1906c990decddd710c22fec776af66', // multisend
] as string[]
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
      `Unknown Transaction \ntx.hashHex: ${tx.hashHex}, tx.lt: ${tx.lt}, tx.inMessage?.opHex: ${tx.inMessage?.opHex}, tx.outMessages?.[0]?.opHex: ${tx.outMessages?.[0]?.opHex}`,
    )
  }
}

export default handleRouterTransaction
