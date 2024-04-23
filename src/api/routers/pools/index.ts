import { Swap } from '@prisma/client'
import { formatUnits } from 'ethers'
import { Router } from 'express'
import { compact, filter, isEmpty } from 'lodash'
import moment from 'moment'

import prisma from 'src/clients/prisma'
import { FEE_DIVIDER, LP_FEE } from 'src/dex/simulate/contant'
import { isSameAddress } from 'src/utils/address'

const router = Router()

router.get('/pools', async function handler(req, res) {
  const rawPools = await prisma.pool.findMany()
  const tokens = await prisma.token.findMany()
  const bins = await prisma.bins.findMany()
  const tokenPrices = await prisma.tokenPrice.findMany()

  const exchanges30d = await prisma.swap.findMany({
    where: {
      createdAt: {
        gte: moment().subtract(30, 'days').toDate(),
      },
    },
  })
  const exchanges7d = await prisma.swap.findMany({
    where: {
      createdAt: {
        gte: moment().subtract(7, 'days').toDate(),
      },
    },
  })
  const exchanges1d = await prisma.swap.findMany({
    where: {
      createdAt: {
        gte: moment().subtract(1, 'days').toDate(),
      },
    },
  })

  const pools = rawPools.map((pool) => {
    const { reserveX, reserveY, tokenXAddress, tokenYAddress, type, lpSupply } =
      pool
    const tokenX = tokens.find((token) => token.id === tokenXAddress)
    const tokenY = tokens.find((token) => token.id === tokenYAddress)

    const tokenPriceX = tokenPrices.find((t) => isSameAddress(t.id, tokenX?.id))
    const tokenPriceY = tokenPrices.find((t) => isSameAddress(t.id, tokenY?.id))
    const priceX = Number(tokenPriceX?.price) || 0
    const priceY = Number(tokenPriceY?.price) || 0

    if (type === 'CPMM') {
      if (!Number(reserveX) || !Number(reserveY)) {
        console.warn('Reserve not found', pool.id)
        return
      }
    }
    if (!tokenX) {
      console.warn('TokenX not found', tokenXAddress)
      return
    }

    if (!tokenY) {
      console.warn('TokenY not found', tokenYAddress)
      return
    }

    let reserveData = {}

    if (type === 'CLMM') {
      const poolBins = bins.filter((bin) => bin.poolAddress === pool.id)

      reserveData = {
        reserveX: poolBins
          .reduce((acc, bin) => acc + BigInt(bin.reserveX), BigInt(0))
          .toString(),
        reserveY: poolBins
          .reduce((acc, bin) => acc + BigInt(bin.reserveY), BigInt(0))
          .toString(),
        totalSupply: lpSupply,
      }
    } else {
      reserveData = {
        reserveX,
        reserveY,
        totalSupply: lpSupply,
      }
    }

    // total usd price of pool reserve
    const tvl =
      priceX * Number(formatUnits(BigInt(reserveX), tokenX?.decimals)) +
      priceY * Number(formatUnits(BigInt(reserveY), tokenY?.decimals))

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

    const volumeUsd30d = getVolumeUsdOfExchange(
      filter(exchanges30d, (d) => d.poolAddress === pool.id),
      priceX,
      priceY,
      tokenX.decimals,
      tokenY.decimals,
    )
    const volumeUsd7d = getVolumeUsdOfExchange(
      filter(exchanges7d, (d) => d.poolAddress === pool.id),
      priceX,
      priceY,
      tokenX.decimals,
      tokenY.decimals,
    )

    const volumeUsd1d = getVolumeUsdOfExchange(
      filter(exchanges1d, (d) => d.poolAddress === pool.id),
      priceX,
      priceY,
      tokenX.decimals,
      tokenY.decimals,
    )

    const apy1d = getApy(volumeUsd1d, tvl, 365)
    const apy7d = getApy(volumeUsd7d, tvl, 365 / 7)
    const apy30d = getApy(volumeUsd30d, tvl, 365 / 30)

    return {
      ...pool,
      tokenX,
      tokenY,
      ...reserveData,
      tvl,
      volumeUsd: volumeUsd1d, // 24h volume (sum of all exchanges)
      volumeUsd7d: volumeUsd7d,
      volumeUsd30d: volumeUsd30d,
      feeUsd,
      apy: apy1d,
      apy7d,
      apy30d,
    }
  })
  return res.json(compact(pools))
})

export default router

// get cumulated volume, apply current token price
const getVolumeUsdOfExchange = (
  exchanges: Swap[],
  priceX: number,
  priceY: number,
  decimalsX: number,
  decimalsY: number,
) => {
  if (isEmpty(exchanges) || !priceX || !priceY || !decimalsX || !decimalsY) {
    return 0
  }

  let tokenXAmount = 0
  let tokenYAmount = 0

  exchanges.forEach((exchange) => {
    const { amountIn, swapForY } = exchange
    if (swapForY) {
      tokenYAmount += Number(amountIn)
    } else {
      tokenXAmount += Number(amountIn)
    }
  })

  return (
    priceX * Number(formatUnits(tokenXAmount, decimalsX)) +
    priceY * Number(formatUnits(tokenYAmount, decimalsY))
  )
}

const getApy = (volumeUsd: number, tvl: number, timestampForYear: number) =>
  (volumeUsd / tvl) * (LP_FEE / FEE_DIVIDER) * 100 * timestampForYear
