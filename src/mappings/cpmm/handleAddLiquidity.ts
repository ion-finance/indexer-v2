import BigNumber from 'bignumber.js'

import prisma from 'src/clients/prisma'
import { parseCbAddLiquidity } from 'src/parsers/cpmm/parseCbAddLiquidity'
import { parseMint } from 'src/parsers/cpmm/parseMint'
import { OP } from 'src/tasks/handleRouterTransaction/opCode'
import { findOutMessageWithOp } from 'src/transactions'
import { ParsedTransaction } from 'src/types/ton-center'
import { msgToCell } from 'src/utils/cell'
import { toISOString } from 'src/utils/date'
import { warn } from 'src/utils/log'

import { createToken } from './createToken'

export const handleAddLiquidity = async ({
  provideLpTx,
  addLiquidityTx,
  cbAddLiquidityTx,
}: {
  provideLpTx: ParsedTransaction
  addLiquidityTx: ParsedTransaction
  cbAddLiquidityTx: ParsedTransaction
}) => {
  const routerAddress = process.env.ROUTER_ADDRESS || ''
  const poolAddress = provideLpTx.inMessage?.info?.dest?.toString()
  const cbAddLiquidityString = cbAddLiquidityTx.inMessage?.msg
  const mintString = findOutMessageWithOp(
    cbAddLiquidityTx,
    OP.INTERNAL_TRANSFER,
  )?.msg

  if (!poolAddress) {
    warn('Empty poolAddress')
    return
  }
  if (!cbAddLiquidityString) {
    warn('Empty cbAddLiquidityString')
    return
  }
  if (!mintString) {
    warn('Empty mintString')
    return
  }

  const { amount0, amount1, userAddress } = parseCbAddLiquidity(
    msgToCell(cbAddLiquidityString),
  )
  const { amount: minted, to } = parseMint(msgToCell(mintString))
  const pool = await prisma.pool.findFirst({
    where: {
      id: poolAddress,
    },
  })

  if (!pool) {
    console.warn('Pool not found.')
    console.log('poolAddress', poolAddress)
    return
  }

  const { lt, hash, hashHex } = provideLpTx

  // const hash = trace.transaction.hash
  const timestamp = toISOString(cbAddLiquidityTx.now)

  const deposit = await prisma.deposit.findFirst({
    where: { id: hashHex },
  })

  if (deposit) {
    warn('deposit already exists.')
    return
  }

  const amountX = amount0.toString()
  const amountY = amount1.toString()

  await prisma.deposit.create({
    data: {
      id: hashHex,
      hash,
      senderAddress: userAddress,
      receiverAddress: to ? to.toString() : '',
      poolAddress,
      tokenAddress: pool.tokenXAddress, // TODO : In case of cpmm, tokenXAddress is unnecessary.
      amountX,
      amountY,
      minted: minted.toString(),
      timestamp,
    },
  })

  const tokens = await prisma.token.findMany()
  const { tokenXAddress, tokenYAddress } = pool
  const tokenXInDatabase = tokens.find((token) => token.id === tokenXAddress)
  const tokenYInDatabase = tokens.find((token) => token.id === tokenYAddress)

  // if tokenX is empty, it means router_token_x is not initilized yet.
  const updatedTokenX = tokenXInDatabase
    ? tokenXInDatabase
    : await createToken(tokenXAddress, timestamp)
  const updatedTokenY = tokenYInDatabase
    ? tokenYInDatabase
    : await createToken(tokenYAddress, timestamp)
  const name = `${updatedTokenX?.symbol}-${updatedTokenY?.symbol}`

  await prisma.pool.update({
    where: {
      id: pool.id,
    },
    data: {
      name,
      reserveX: BigNumber(pool.reserveX).plus(amountX).toString(),
      reserveY: BigNumber(pool.reserveY).plus(amountY).toString(),
      lpSupply: BigNumber(pool.lpSupply).plus(minted).toString(),
    },
  })

  const receiverAddress = to ? to.toString() : ''
  const lpTokenWallet = await prisma.lpTokenWallet.findFirst({
    where: {
      poolAddress,
      ownerAddress: receiverAddress,
    },
  })

  if (lpTokenWallet) {
    await prisma.lpTokenWallet.update({
      where: {
        id: lpTokenWallet.id,
      },
      data: {
        amount: BigNumber(lpTokenWallet.amount).plus(minted).toString(),
      },
    })
  } else {
    await prisma.lpTokenWallet.create({
      data: {
        poolAddress,
        ownerAddress: to ? to.toString() : '',
        amount: minted.toString(),
        // lt: lt.toString(),
        timestamp,
      },
    })
  }

  // Operation: all txs which destination is pool
  // operation for op: 'provide_lp'
  await prisma.operation.create({
    data: {
      poolTxHash: provideLpTx.hashHex,
      poolAddress: pool.id,
      routerAddress,
      poolTxLt: String(provideLpTx.lt),
      poolTxTimestamp: toISOString(provideLpTx.now),
      destinationWalletAddress: to ? to.toString() : '',
      operationType: 'send_liquidity',
      exitCode: 'provide_liquidity_ok',
      asset0Address: tokenXAddress,
      asset0Amount: amountX,
      asset0Delta: '0',
      asset0Reserve: pool.reserveX,
      asset1Address: tokenYAddress,
      asset1Amount: amountY,
      asset1Delta: '0',
      asset1Reserve: pool.reserveY,
      lpTokenDelta: '0',
      lpTokenSupply: pool.lpSupply, // TODO: check lpTSupply before or after
      lpFeeAmount: '0',
      protocolFeeAmount: '0',
      referralFeeAmount: '0',
      walletAddress: userAddress.toString(),
    },
  })

  // operation for op: 'cb_add_liquidity'
  await prisma.operation.create({
    data: {
      poolTxHash: cbAddLiquidityTx.hashHex,
      poolAddress: pool.id,
      routerAddress,
      poolTxLt: String(cbAddLiquidityTx.lt),
      poolTxTimestamp: toISOString(cbAddLiquidityTx.now),
      destinationWalletAddress: to ? to.toString() : '',
      operationType: 'add_liquidity',
      exitCode: 'mint_ok',
      asset0Address: tokenXAddress,
      asset0Amount: amountX,
      asset0Delta: '0',
      asset0Reserve: pool.reserveX,
      asset1Address: tokenYAddress,
      asset1Amount: amountY,
      asset1Delta: '0',
      asset1Reserve: pool.reserveY,
      lpTokenDelta: String(minted),
      lpTokenSupply: pool.lpSupply, // TODO: check lpTSupply before or after
      lpFeeAmount: '0',
      protocolFeeAmount: '0',
      referralFeeAmount: '0',
      walletAddress: userAddress.toString(),
    },
  })
}

export default handleAddLiquidity
