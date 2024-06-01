import handleAddLiquidity from 'src/mappings/cpmm/handleAddLiquidity'
import handleExchange from 'src/mappings/cpmm/handleExchange'
import handlePoolCreated from 'src/mappings/cpmm/handlePoolCreated'
import handleRemoveLiquidity from 'src/mappings/cpmm/handleRemoveLiquidity'
import { findOutMessageWithOp, logUnknownTransaction } from 'src/transactions'
import { ParsedTransaction } from 'src/types/ton-center'

import {
  findAddLiquidityTxs,
  findBurnNotificationTxs,
  findExchangeTxs,
  findPoolCreatedTxs,
} from './getTransactions'
import { OP } from './opCode'

const handleRouterTransaction = async ({
  routerTxs,
  routerTx,
  txsCount,
  toLt,
}: {
  routerTxs: ParsedTransaction[]
  routerTx: ParsedTransaction
  txsCount: number
  toLt?: string
}) => {
  const swapMessage = findOutMessageWithOp(routerTx, OP.SWAP)
  const provideLpMessage = findOutMessageWithOp(routerTx, OP.PROVIDE_LP)

  const isSwap =
    swapMessage && routerTx.inMessage?.opHex === OP.TRANSFER_NOTIFICATION
  const isProvideLp =
    provideLpMessage && routerTx.inMessage?.opHex === OP.TRANSFER_NOTIFICATION
  const isPayTo = routerTx.inMessage?.opHex === OP.PAY_TO

  if (isSwap) {
    const exchangeTxs = await findExchangeTxs({
      routerTx,
      routerTxs,
      toLt,
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
      toLt,
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
      toLt,
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
    // pay_to maybe the consequence of swap or burn_notification
    //  - swap -> do nothing
    //  - burn_notification -> handle burn_notification

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

export default handleRouterTransaction
