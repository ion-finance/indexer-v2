import { PoolType } from '@prisma/client'
import { Address } from '@ton/core'
import { formatUnits } from 'ethers'
import { Router } from 'express'
import { compact } from 'lodash'

import prisma from 'src/clients/prisma'
import { isSameAddress } from 'src/utils/address'

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
    const priceX = Number(tokenPriceX?.price) || 0
    const priceY = Number(tokenPriceY?.price) || 0

    if (!pool || !tokenX || !tokenY || !tokenPriceX || !tokenPriceY) {
      return null
    }

    const depositsOfPool = deposits.filter((d) => d.poolAddress === pool?.id)
    const xSum = depositsOfPool.reduce(
      (res, cur) => res + Number(cur.amountX),
      0,
    )
    const ySum = depositsOfPool.reduce(
      (res, cur) => res + Number(cur.amountY),
      0,
    )

    const lpBalance = (function () {
      if (pool?.type === PoolType.CPMM) {
        return Number(wallet.amount)
      }
      const shares = wallet.shares as { amount: string }[]
      return shares.reduce((res, cur) => {
        return (
          res + (tokenY ? Number(formatUnits(cur.amount, tokenY.decimals)) : 0)
        )
      }, 0)
    })()

    const lpWalletsOfPool = lpTokenWallets.filter(
      (lp) => lp.poolAddress === pool?.id,
    )
    const totalLpAmount = lpWalletsOfPool.reduce(
      (res, cur) => res + Number(cur.amount),
      0,
    )

    // total usd price of pool reserve
    const totalPrice =
      priceX * Number(formatUnits(BigInt(pool.reserveX), tokenX?.decimals)) +
      priceY * Number(formatUnits(BigInt(pool.reserveY), tokenY?.decimals))

    const balanceUsd = totalPrice * (lpBalance / totalLpAmount)

    // total usd price of pool collected protocol fee
    const feeUsd =
      priceX *
        Number(
          formatUnits(BigInt(pool.collectedXProtocolFee), tokenX?.decimals),
        ) +
      priceY *
        Number(
          formatUnits(BigInt(pool.collectedYProtocolFee), tokenY?.decimals),
        )

    return {
      ...wallet,
      feeUsd,
      balanceUsd,
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

  // TODO: calculate apy
  // to calculate apy, we need to write the price of token, when deposit occur.
  const apy = 12.2
  return res.json({
    summary: {
      balanceUsd: positions.reduce((res, cur) => res + cur.balanceUsd, 0),
      earnedUsd: positions.reduce((res, cur) => res + cur.feeUsd, 0),
      apy,
    },
    positions,
  })
})

export default router
