import BigNumber from 'bignumber.js'
import { find, isEmpty, map } from 'lodash'

import prisma from 'src/clients/prisma'
import getLatestTokenPrices from 'src/common/tokenPrice'
import {
  FEE_DIVIDER,
  LP_FEE,
  PROTOCOL_FEE,
  REF_FEE,
} from 'src/dex/simulate/contant'
import { calculateOutAmount } from 'src/dex/simulate/utils'
import { parsePayTo } from 'src/parsers/cpmm/parsePayTo'
import { parseSwap } from 'src/parsers/cpmm/parseSwap'
import { parseTransferNotification } from 'src/parsers/cpmm/parseTransferNotification'
import { EXIT_CODE } from 'src/tasks/handleRouterTransaction/opCode'
import { ParsedTransaction } from 'src/types/ton-center'
import { isSameAddress } from 'src/utils/address'
import { bFormatUnits } from 'src/utils/bigNumber'
import { msgToCell } from 'src/utils/cell'
import { toISOString } from 'src/utils/date'
import { warn } from 'src/utils/log'

export const handleExchange = async ({
  transferNotificationTx,
  swapTx,
  payToTxs,
}: {
  transferNotificationTx?: ParsedTransaction
  swapTx?: ParsedTransaction
  payToTxs?: ParsedTransaction[]
}) => {
  if (isEmpty(payToTxs)) {
    warn('Empty payToTxs')
    return
  }
  if (!transferNotificationTx || !swapTx) {
    warn('Empty tx data in handleExchange')
    return
  }
  const tokenPrices = await getLatestTokenPrices()
  const tokens = await prisma.token.findMany()

  const routerAddress = process.env.ROUTER_ADDRESS || ''
  const poolAddress = swapTx.inMessage?.info?.dest?.toString()
  const transferNotificationString = transferNotificationTx.inMessage?.msg
  const swapString = swapTx.inMessage?.msg

  if (!poolAddress) {
    warn('Empty poolAddress')
    return
  }
  if (!transferNotificationString) {
    warn('Empty transferNotificationString')
    return
  }
  if (!swapString) {
    warn('Empty swapString')
    return
  }

  const { fromUser } = parseTransferNotification(
    msgToCell(transferNotificationString),
  )

  const {
    senderAddress: sendTokenAddress,
    jettonAmount,
    hasRef,
    toAddress: receiverAddress,
  } = parseSwap(msgToCell(swapString))

  const payToNormalTx = find(payToTxs, (payToTx) => {
    const { exitCode } = parsePayTo(msgToCell(payToTx.inMessage?.msg || ''))
    return exitCode === Number(EXIT_CODE.SWAP_OK)
  })

  const payToRefTx = find(payToTxs, (payToTx) => {
    const { exitCode } = parsePayTo(msgToCell(payToTx.inMessage?.msg || ''))
    return exitCode === Number(EXIT_CODE.SWAP_OK_REF)
  })

  if (!payToNormalTx) {
    const exitCodes = map(payToTxs, (payToTx) => {
      const { exitCode } = parsePayTo(msgToCell(payToTx.inMessage?.msg || ''))
      return exitCode
    })
    exitCodes.forEach((exitCode) => {
      if (exitCode === Number(EXIT_CODE.SWAP_REFUND_NO_LIQ)) {
        warn(
          'Skip failed swap. Empty payToNormalTx. exit code: SWAP_REFUND_NO_LIQ',
        )
        return
      } else if (exitCode === Number(EXIT_CODE.SWAP_REFUND_RESERVE_ERR)) {
        warn(
          'Skip failed swap. Empty payToNormalTx. exit code: SWAP_REFUND_RESERVE_ERR',
        )
        return
      }
    })
    warn('Skip failed swap. Empty payToNormalTx, exit code: ')
    return
  }

  if (hasRef && !payToRefTx) {
    warn("Empty payToRefTx given 'hasRef'")
    return
  }

  const payToNormal = parsePayTo(msgToCell(payToNormalTx.inMessage?.msg || ''))

  // TODO: write amountOut of paytoRef in Swap table
  const payToRef =
    payToRefTx && parsePayTo(msgToCell(payToRefTx.inMessage?.msg || ''))

  const { amount0Out, amount1Out } = payToNormal

  const amountIn = jettonAmount

  const amountOut = (function () {
    if (amount0Out.isZero()) {
      return amount1Out
    }
    return amount0Out
  })()

  const pool = await prisma.pool.findFirst({
    where: {
      id: poolAddress,
    },
  })

  if (!pool) {
    warn('Pool not found.')
    return
  }

  const { tokenXAddress, tokenYAddress } = pool
  const tokenX = tokens.find((token) => token.id === tokenXAddress)
  const tokenY = tokens.find((token) => token.id === tokenYAddress)
  const tokenPriceX = tokenPrices.find((price) =>
    isSameAddress(price.id, tokenXAddress),
  )
  const tokenPriceY = tokenPrices.find((price) =>
    isSameAddress(price.id, tokenYAddress),
  )
  const priceX = BigNumber(tokenPriceX?.price || 0)
  const priceY = BigNumber(tokenPriceY?.price || 0)
  const swapForY = sendTokenAddress === tokenXAddress

  const { hashHex, hash } = swapTx

  const swap = await prisma.swap.findFirst({
    where: { id: hashHex },
  })

  if (swap) {
    warn('Swap already exists.')
    return
  }

  const senderAddress = fromUser

  const volumeUsd = swapForY
    ? BigNumber(bFormatUnits(amountIn, tokenX?.decimals || 0)).multipliedBy(
        priceX,
      )
    : BigNumber(bFormatUnits(amountIn, tokenY?.decimals || 0)).multipliedBy(
        priceY,
      )

  await prisma.swap.upsert({
    where: {
      id: hashHex,
    },
    update: {},
    create: {
      id: hashHex,
      hash,
      poolAddress,
      sendTokenAddress,
      receiveTokenAddress: swapForY ? tokenYAddress : tokenXAddress,
      senderAddress,
      receiverAddress,
      amountIn: amountIn.toString(),
      amountOut: amountOut.toString(),
      swapForY,
      volumeUsd: volumeUsd.toString(),
      timestamp: toISOString(swapTx.now),
    },
  })

  const { protocolFeeOut } = calculateOutAmount({
    amountIn,
    hasRef: !!payToRef,
    lpFee: LP_FEE,
    protocolFee: PROTOCOL_FEE,
    refFee: REF_FEE,
    reserveIn: swapForY ? BigNumber(pool.reserveX) : BigNumber(pool.reserveY),
    reserveOut: swapForY ? BigNumber(pool.reserveY) : BigNumber(pool.reserveX),
  })
  const lpFeeAmount = amountIn.multipliedBy(LP_FEE).div(FEE_DIVIDER)
  const protocolFeeAmount = protocolFeeOut

  const referralFeeAmount = (function () {
    if (!payToRef) {
      return BigNumber(0)
    }
    const { amount0Out, amount1Out } = payToRef
    if (amount0Out.isZero()) {
      return amount1Out
    }
    return amount0Out
  })()

  const { asset0Delta, asset0Amount, asset1Delta, asset1Amount } =
    (function () {
      const assetOutAmount = amountOut
      const assetOutDelta = assetOutAmount
        .plus(protocolFeeAmount)
        .plus(referralFeeAmount)

      if (swapForY) {
        return {
          asset0Delta: amountIn,
          asset0Amount: amountIn,
          asset1Delta: -assetOutDelta,
          asset1Amount: -assetOutAmount,
        }
      } else {
        return {
          asset0Delta: -assetOutDelta,
          asset0Amount: -assetOutAmount,
          asset1Delta: amountIn,
          asset1Amount: amountIn,
        }
      }
    })()

  await prisma.operation.create({
    data: {
      poolTxHash: swapTx.hashHex,
      poolAddress: pool.id,
      routerAddress,
      poolTxLt: String(swapTx.lt),
      poolTxTimestamp: toISOString(swapTx.now),
      destinationWalletAddress: receiverAddress,
      operationType: 'swap',
      exitCode: 'swap_ok',

      // if swap is for Y, then asset0 is tokenX and asset1 is tokenY
      asset0Address: tokenXAddress,
      asset0Amount: asset0Amount.toString(),
      asset0Delta: asset0Delta.toString(),
      asset0Reserve: pool.reserveX,

      asset1Address: tokenYAddress,
      asset1Amount: asset1Amount.toString(),
      asset1Delta: asset1Delta.toString(),
      asset1Reserve: pool.reserveY,

      lpTokenDelta: '0', // always 0 for swap
      lpTokenSupply: pool.lpSupply, // TODO: check lpTSupply before or after

      lpFeeAmount: lpFeeAmount.toString(),
      protocolFeeAmount: protocolFeeAmount.toString(),
      referralFeeAmount: referralFeeAmount.toString(),

      walletAddress: senderAddress,
      // walletTxLt: String(walletTrace.transaction.lt),
      // walletTxHash: walletTrace.transaction.hash,
      // walletTxTimestamp: new Date(
      //   walletTrace.transaction.utime * 1000,
      // ).toISOString(),
    },
  })

  let reserveX = BigNumber(pool.reserveX)
  let reserveY = BigNumber(pool.reserveY)
  let collectedXProtocolFee = BigNumber(pool.collectedXProtocolFee)
  let collectedYProtocolFee = BigNumber(pool.collectedYProtocolFee)

  // !NOTE: Use amountOut, referralFeeAmount of block data, not simulated one.
  const out = amountOut.plus(protocolFeeAmount).plus(referralFeeAmount)

  if (swapForY) {
    reserveX = reserveX.plus(amountIn)
    reserveY = reserveY.minus(out)
    collectedYProtocolFee = collectedYProtocolFee.plus(protocolFeeAmount)
  } else {
    reserveX = reserveX.minus(out)
    reserveY = reserveY.plus(amountIn)
    collectedXProtocolFee = collectedXProtocolFee.plus(protocolFeeAmount)
  }

  await prisma.pool.update({
    where: {
      id: pool.id,
    },
    data: {
      reserveX: reserveX.toString(),
      reserveY: reserveY.toString(),
      collectedXProtocolFee: collectedXProtocolFee.toString(),
      collectedYProtocolFee: collectedYProtocolFee.toString(),
    },
  })
}

export default handleExchange
