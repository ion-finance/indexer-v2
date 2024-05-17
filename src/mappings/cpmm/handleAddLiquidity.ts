import BigNumber from 'bignumber.js'
import { map } from 'lodash'

import prisma from 'src/clients/prisma'
import { parseCbAddLiquidity } from 'src/parsers/cpmm/parseCbAddLiquidity'
import { parseMint } from 'src/parsers/cpmm/parseMint'
import { OP } from 'src/tasks/handleEvent/opCode'
import { Trace } from 'src/types/ton-api'
import {
  findTracesByOpCode,
  findTracesOfPool,
  isSameAddress,
  parseRaw,
} from 'src/utils/address'
import { toISOString } from 'src/utils/date'
import { warn } from 'src/utils/log'

import { upsertToken } from './upsertToken'

export const handleAddLiquidity = async ({
  eventId,
  trace,
}: {
  eventId: string
  trace: Trace
}) => {
  const routerAddress = process.env.ROUTER_ADDRESS || ''
  const cbAddLiquidityTrace = findTracesByOpCode(
    trace,
    OP.CB_ADD_LIQUIDITY,
  )?.[0]
  if (!cbAddLiquidityTrace) {
    warn('Empty cbAddLiquidityTrace')
    return
  }

  const { raw_body: cbAddLiquidityBody, destination } =
    cbAddLiquidityTrace?.transaction.in_msg || {}
  if (!cbAddLiquidityBody) {
    warn('Empty raw_body cbAddLiquidityTrace')
    return
  }
  if (!destination) {
    warn('Empty destination cbAddLiquidityTrace')
    return
  }
  const poolAddress = parseRaw(destination.address)
  const { amount0, amount1, userAddress } =
    parseCbAddLiquidity(cbAddLiquidityBody)

  const internalTransferTraces = findTracesByOpCode(trace, OP.INTERNAL_TRANSFER)
  if (!internalTransferTraces) {
    warn('Empty internalTransferTraces')
    return
  }

  const mintTrace = internalTransferTraces?.find(
    (trace: Trace) =>
      parseRaw(trace.transaction.in_msg?.source?.address) === poolAddress,
  )

  const { raw_body: mintRawBody } = mintTrace?.transaction.in_msg || {}
  if (!mintRawBody) {
    warn('Empty raw_body mintTrace')
    return
  }

  const { amount: minted, to } = parseMint(mintRawBody)
  // if (!to) {
  //   warn("Initial Liquidity found. Skip this event.");
  //   return;
  // }

  const pool = await prisma.pool.findFirst({
    where: {
      id: poolAddress,
    },
  })

  if (!pool) {
    warn('Pool not found.')
    return
  }

  const hash = trace.transaction.hash
  const utime = trace.transaction.utime
  const timestamp = toISOString(utime)

  const deposit = await prisma.deposit.findFirst({
    where: { id: hash, eventId },
  })

  if (deposit) {
    warn('deposit already exists.')
    return
  }

  const amountX = amount0.toString()
  const amountY = amount1.toString()

  await prisma.deposit.upsert({
    where: {
      id: hash,
      eventId,
    },
    update: {
      senderAddress: userAddress,
      receiverAddress: to ? to.toString() : '',
      poolAddress,
      amountX,
      amountY,
      minted: minted.toString(),
    },
    create: {
      id: hash,
      eventId,
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
  const tokenX = tokens.find((token) => token.id === tokenXAddress)
  const tokenY = tokens.find((token) => token.id === tokenYAddress)

  // if tokenX is empty, it means router_token_x is not initilized yet.
  const updatedTokenX = tokenX
    ? tokenX
    : await upsertToken(tokenXAddress, timestamp)
  const updatedTokenY = tokenY
    ? tokenY
    : await upsertToken(tokenYAddress, timestamp)
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
        timestamp,
      },
    })
  }

  const poolTraces = findTracesOfPool(trace, poolAddress)
  const walletTrace = trace

  await Promise.all(
    map(poolTraces, async (trace) => {
      const { hash, lt, utime, in_msg } = trace.transaction
      const isFromRouter = isSameAddress(in_msg?.source?.address, routerAddress)
      const operationType = isFromRouter ? 'send_liquidity' : 'add_liquidity'
      const exitCode = isFromRouter ? 'provide_liquidity_ok' : 'mint_ok'
      const lpTokenDelta = exitCode === 'mint_ok' ? String(minted) : '0'

      await prisma.operation.create({
        data: {
          poolTxHash: hash,
          poolAddress: pool.id,
          routerAddress,
          poolTxLt: String(lt),
          poolTxTimestamp: new Date(utime * 1000).toISOString(),
          destinationWalletAddress: to ? to.toString() : '',
          operationType,
          exitCode,
          asset0Address: tokenXAddress,
          asset0Amount: amountX,
          asset0Delta: '0',
          asset0Reserve: pool.reserveX,
          asset1Address: tokenYAddress,
          asset1Amount: amountY,
          asset1Delta: '0',
          asset1Reserve: pool.reserveY,
          lpTokenDelta,
          lpTokenSupply: pool.lpSupply, // TODO: check lpTSupply before or after
          lpFeeAmount: '0',
          protocolFeeAmount: '0',
          referralFeeAmount: '0',
          walletAddress: parseRaw(walletTrace.transaction.account.address),
          walletTxLt: String(walletTrace.transaction.lt),
          walletTxHash: walletTrace.transaction.hash,
          walletTxTimestamp: new Date(
            walletTrace.transaction.utime * 1000,
          ).toISOString(),
        },
      })
    }),
  )
}

export default handleAddLiquidity
