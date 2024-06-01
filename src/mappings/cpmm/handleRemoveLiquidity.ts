import BigNumber from 'bignumber.js'

import prisma from 'src/clients/prisma'
import { parseBurnNotification } from 'src/parsers/cpmm/parseBurnNotification'
import { parsePayTo } from 'src/parsers/cpmm/parsePayTo'
import { OP } from 'src/tasks/handleRouterTransaction/opCode'
import { findOutMessageWithOp } from 'src/transactions'
import { ParsedTransaction } from 'src/types/ton-center'
import { msgToCell } from 'src/utils/cell'
import { toISOString } from 'src/utils/date'
import { warn } from 'src/utils/log'

export const handleRemoveLiquidity = async ({
  burnNotificationTx,
}: {
  burnNotificationTx: ParsedTransaction
}) => {
  const routerAddress = process.env.ROUTER_ADDRESS || ''
  const poolAddress = burnNotificationTx.inMessage?.info?.dest?.toString()
  const burnNotificationString = burnNotificationTx.inMessage?.msg
  const payToString = findOutMessageWithOp(burnNotificationTx, OP.PAY_TO)?.msg
  if (!poolAddress) {
    warn('Empty poolAddress')
    return
  }
  if (!burnNotificationString) {
    warn('Empty burnNotificationString')
    return
  }
  if (!payToString) {
    warn('Empty payToString')
    return
  }

  const { toAddress, amount0Out, amount1Out } = parsePayTo(
    msgToCell(payToString),
  )

  const { jettonAmount: burned, fromAddress } = parseBurnNotification(
    msgToCell(burnNotificationString),
  )

  const pool = await prisma.pool.findFirst({
    where: {
      id: poolAddress,
    },
  })

  if (!pool) {
    warn('Pool not found.')
    return
  }

  const { hashHex, hash } = burnNotificationTx
  const timestamp = toISOString(burnNotificationTx.now)

  const withdraw = await prisma.withdraw.findFirst({
    where: { id: hashHex },
  })

  if (withdraw) {
    warn('withdraw already exists.')
    return
  }

  const senderAddress = fromAddress

  await prisma.withdraw.create({
    data: {
      id: hashHex,
      hash,
      senderAddress,
      receiverAddress: toAddress,
      poolAddress,
      amountX: amount0Out.toString(),
      amountY: amount1Out.toString(),
      burned: burned.toString(),
      timestamp,
    },
  })

  const { tokenXAddress, tokenYAddress } = pool

  await prisma.operation.create({
    data: {
      poolTxHash: burnNotificationTx.hashHex,
      poolAddress: pool.id,
      routerAddress,
      poolTxLt: String(burnNotificationTx.lt),
      poolTxTimestamp: toISOString(burnNotificationTx.now),
      destinationWalletAddress: toAddress,
      operationType: 'withdraw_liquidity',
      exitCode: 'burn_ok',

      asset0Address: tokenXAddress,
      asset0Amount: (-amount0Out).toString(),
      asset0Delta: '0', // always 0 for withdraw
      asset0Reserve: pool.reserveX,

      asset1Address: tokenYAddress,
      asset1Amount: (-amount1Out).toString(),
      asset1Delta: '0',
      asset1Reserve: pool.reserveY,

      lpTokenDelta: String(-burned),
      lpTokenSupply: pool.lpSupply,

      lpFeeAmount: '0', // always 0 for withdraw
      protocolFeeAmount: '0',
      referralFeeAmount: '0',
    },
  })

  await prisma.pool.update({
    where: {
      id: pool.id,
    },
    data: {
      reserveX: BigNumber(pool.reserveX).minus(amount0Out).toString(),
      reserveY: BigNumber(pool.reserveY).minus(amount1Out).toString(),
      lpSupply: BigNumber(pool.lpSupply).minus(burned).toString(),
    },
  })

  const lpTokenWallet = await prisma.lpTokenWallet.findFirst({
    where: {
      poolAddress,
      ownerAddress: senderAddress,
    },
  })

  if (lpTokenWallet) {
    await prisma.lpTokenWallet.update({
      where: {
        id: lpTokenWallet.id,
      },
      data: {
        amount: BigNumber(lpTokenWallet.amount).minus(burned).toString(),
      },
    })
  } else {
    await prisma.lpTokenWallet.create({
      data: {
        poolAddress,
        ownerAddress: senderAddress,
        amount: '0',
        timestamp,
      },
    })
  }
}

export default handleRemoveLiquidity
