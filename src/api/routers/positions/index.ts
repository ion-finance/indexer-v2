import { Address } from '@ton/core'
import BigNumber from 'bignumber.js'
import { Router } from 'express'
import { compact } from 'lodash'

import prisma from 'src/clients/prisma'
import { isSameAddress } from 'src/utils/address'
import { bFormatUnits } from 'src/utils/bigNumber'

const router = Router()

router.get('/positions/:address', async function handler(req, res) {
  const parsed = Address.parse(req.params.address).toString()
  const tokenPrices = await prisma.tokenPrice.findMany()

  const [tokens, pools, lpTokenWallets, deposits] = await Promise.all([
    prisma.token.findMany(),
    prisma.pool.findMany(),
    prisma.lpTokenWallet.findMany({
      where: {
        ownerAddress: parsed,
      },
    }),
    prisma.deposit.findMany({
      where: {
        senderAddress: parsed,
      },
    }),
  ])

  const data = lpTokenWallets.map((wallet) => {
    const pool = pools.find((p) => p.id === wallet.poolAddress)
    const tokenX = tokens.find((t) => t.id === pool?.tokenXAddress)
    const tokenY = tokens.find((t) => t.id === pool?.tokenYAddress)
    const tokenPriceX = tokenPrices.find((t) => isSameAddress(t.id, tokenX?.id))
    const tokenPriceY = tokenPrices.find((t) => isSameAddress(t.id, tokenY?.id))
    const priceX = BigNumber(tokenPriceX?.price || 0)
    const priceY = BigNumber(tokenPriceY?.price || 0)

    if (!pool || !tokenX || !tokenY || !tokenPriceX || !tokenPriceY) {
      return null
    }

    const depositsOfPool = deposits.filter((d) => d.poolAddress === pool?.id)
    const xSum = depositsOfPool.reduce(
      (res, cur) => res.plus(cur.amountX),
      BigNumber(0),
    )
    const ySum = depositsOfPool.reduce(
      (res, cur) => res.plus(cur.amountY),
      BigNumber(0),
    )

    // const lpBalance = (function () {
    //   if (pool?.type === PoolType.CPMM) {
    //     return Number(wallet.amount)
    //   }
    //   const shares = wallet.shares as { amount: string }[]
    //   return shares.reduce((res, cur) => {
    //     return (
    //       res + (tokenY ? Number(formatUnits(cur.amount, tokenY.decimals)) : 0)
    //     )
    //   }, 0)
    // })()
    const lpBalance = wallet.amount ? BigNumber(wallet.amount) : BigNumber(0)

    const lpWalletsOfPool = lpTokenWallets.filter(
      (lp) => lp.poolAddress === pool?.id,
    )
    const totalLpAmount = lpWalletsOfPool.reduce(
      (res, cur) => res.plus(cur.amount),
      BigNumber(0),
    )

    // total usd price of pool reserve
    const usdValueX = priceX.multipliedBy(
      bFormatUnits(BigNumber(pool.reserveX), tokenX?.decimals || 0),
    )
    const usdValueY = priceY.multipliedBy(
      bFormatUnits(BigNumber(pool.reserveY), tokenY?.decimals || 0),
    )
    const totalUsdValue = usdValueX.plus(usdValueY)

    // const balanceUsd = totalUsdValue * (lpBalance / totalLpAmount)
    const balanceUsd = totalUsdValue.multipliedBy(lpBalance).div(totalLpAmount)

    // total usd price of pool collected protocol fee
    // // TODO: this is wrong, need to track lp Fee
    // const feeUsd =
    //   priceX *
    //     Number(
    //       formatUnits(BigInt(pool.collectedXProtocolFee), tokenX?.decimals),
    //     ) +
    //   priceY *
    //     Number(
    //       formatUnits(BigInt(pool.collectedYProtocolFee), tokenY?.decimals),
    // )

    return {
      ...wallet,
      balanceUsd: balanceUsd.toString(),
      tokenX: {
        ...tokenX,
        deposited: xSum,
      },
      tokenY: {
        ...tokenY,
        deposited: ySum,
      },
    }
  })

  const positions = compact(data)

  const balanceUsd = positions.reduce(
    (res, cur) => res.plus(cur.balanceUsd),
    BigNumber(0),
  )

  // const apy = 12.2
  // TODO: calculate earnedUsd, accruedFee, apy
  // to calculate apy, we need to write the price of token, when deposit occur.
  return res.json({
    summary: {
      balanceUsd,
      // apy,
      // earnedUsd: positions.reduce((res, cur) => res + cur.feeUsd, 0),
    },
    positions,
  })
})

export default router
