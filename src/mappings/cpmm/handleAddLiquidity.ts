import prisma from '../../clients/prisma'
import { Trace } from '../../types/ton-api'
import {
  findTracesByOpCode,
  findTracesOfPool,
  isSameAddress,
  parseRaw,
} from '../../utils/address'
import { Cell } from '@ton/core'
import { upsertToken } from './upsertToken'
import { OP } from '../../tasks/handleEvent/opCode'
import { map } from 'lodash'

const parseMint = (raw_body: string) => {
  const message = Cell.fromBoc(Buffer.from(raw_body, 'hex'))[0]
  const body = message.beginParse()
  const op = body.loadUint(32)
  const queryId = body.loadUint(64)
  const amount = body.loadCoins()
  const poolAddress = body.loadAddress().toString()
  const to = body.loadMaybeAddress()

  return {
    op,
    queryId,
    amount,
    poolAddress,
    to,
  }
}

const parseCbAddLiquidity = (raw_body: string) => {
  const message = Cell.fromBoc(Buffer.from(raw_body, 'hex'))[0]
  const body = message.beginParse()
  const op = body.loadUint(32)
  const queryId = body.loadUint(64)

  const amount0 = body.loadCoins()
  const amount1 = body.loadCoins()
  const userAddress = body.loadAddress().toString()
  const minLpOut = body.loadCoins()

  return {
    op,
    queryId,
    amount0,
    amount1,
    userAddress,
    minLpOut,
  }
}

export const handleAddLiquidity = async ({
  eventId,
  traces,
}: {
  eventId: string
  traces: Trace
}) => {
  const routerAddress = process.env.ROUTER_ADDRESS || ''
  const cbAddLiquidityTrace = findTracesByOpCode(
    traces,
    OP.CB_ADD_LIQUIDITY,
  )?.[0]
  if (!cbAddLiquidityTrace) {
    console.warn('Empty cbAddLiquidityTrace')
    return
  }

  const { raw_body: cbAddLiquidityBody, destination } =
    cbAddLiquidityTrace?.transaction.in_msg || {}
  if (!cbAddLiquidityBody) {
    console.warn('Empty raw_body cbAddLiquidityTrace')
    return
  }
  if (!destination) {
    console.warn('Empty destination cbAddLiquidityTrace')
    return
  }
  const poolAddress = parseRaw(destination.address)
  const { amount0, amount1, userAddress } =
    parseCbAddLiquidity(cbAddLiquidityBody)

  const internalTransferTraces = findTracesByOpCode(
    traces,
    OP.INTERNAL_TRANSFER,
  )
  if (!internalTransferTraces) {
    console.warn('Empty internalTransferTraces')
    return
  }

  const mintTrace = internalTransferTraces?.find(
    (trace: Trace) =>
      parseRaw(trace.transaction.in_msg?.source?.address) === poolAddress,
  )

  const { raw_body: mintRawBody } = mintTrace?.transaction.in_msg || {}
  if (!mintRawBody) {
    console.warn('Empty raw_body mintTrace')
    return
  }

  const { amount: minted, to } = parseMint(mintRawBody)
  // if (!to) {
  //   console.warn("Initial Liquidity found. Skip this event.");
  //   return;
  // }

  const pool = await prisma.pool.findFirst({
    where: {
      id: poolAddress,
    },
  })

  if (!pool) {
    console.log('Pool not found.')
    return
  }

  const hash = traces.transaction.hash
  const timestamp = traces.transaction.utime

  const deposit = await prisma.deposit.findFirst({
    where: { id: hash, eventId },
  })

  if (deposit) {
    console.log('deposit already exists.')
    return
  }

  const amountX = String(amount0)
  const amountY = String(amount1)

  await prisma.deposit.upsert({
    where: {
      id: hash,
      eventId,
    },
    update: {
      senderAddress: userAddress,
      receiverAddress: userAddress,
      poolAddress,
      amountX,
      amountY,
      timestamp,
    },
    create: {
      id: hash,
      eventId,
      senderAddress: userAddress,
      receiverAddress: userAddress,
      poolAddress,
      tokenAddress: pool.tokenXAddress, // TODO : In case of cpmm, tokenXAddress is unnecessary.
      amountX,
      amountY,
      timestamp,
    },
  })

  const tokens = await prisma.token.findMany()
  const { tokenXAddress, tokenYAddress } = pool
  const tokenX = tokens.find((token) => token.id === tokenXAddress)
  const tokenY = tokens.find((token) => token.id === tokenYAddress)

  // if tokenX is empty, it means router_token_x is not initilized yet.
  const updatedTokenX = tokenX ? tokenX : await upsertToken(tokenXAddress)
  const updatedTokenY = tokenY ? tokenY : await upsertToken(tokenYAddress)
  const name = `${updatedTokenX?.symbol}-${updatedTokenY?.symbol}`

  await prisma.pool.update({
    where: {
      id: pool.id,
    },
    data: {
      name,
      reserveX: (BigInt(pool.reserveX) + BigInt(amountX)).toString(),
      reserveY: (BigInt(pool.reserveY) + BigInt(amountY)).toString(),
      lpSupply: (BigInt(pool.lpSupply) + BigInt(minted)).toString(),
    },
  })

  const lpTokenWallet = await prisma.lpTokenWallet.findFirst({
    where: {
      poolAddress,
      ownerAddress: userAddress,
    },
  })

  if (lpTokenWallet) {
    await prisma.lpTokenWallet.update({
      where: {
        id: lpTokenWallet.id,
      },
      data: {
        amount: (BigInt(lpTokenWallet.amount) + BigInt(minted)).toString(),
      },
    })
  } else {
    await prisma.lpTokenWallet.create({
      data: {
        poolAddress,
        ownerAddress: to ? to.toString() : '',
        amount: BigInt(minted).toString(),
      },
    })
  }

  const poolTraces = findTracesOfPool(traces, poolAddress)
  const walletTrace = traces

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
          destinationWalletAddress: userAddress, // TODO: check.
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
          walletAddress: walletTrace.transaction.in_msg?.source?.address,
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
