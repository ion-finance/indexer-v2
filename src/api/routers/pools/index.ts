import { formatUnits } from 'ethers'
import { Router } from 'express'
import { compact } from 'lodash'

import prisma from 'src/clients/prisma'
import { isSameAddress } from 'src/utils/address'

import { getPriceUsd } from '../../../mocks/price'

const router = Router()

const ONE_DAY = 24 * 60 * 60 * 1000
router.get('/pools', async function handler(req, res) {
  const rawPools = await prisma.pool.findMany()
  const tokens = await prisma.token.findMany()
  const bins = await prisma.bins.findMany()
  const tokenPrices = await prisma.tokenPrice.findMany()

  const exchanges24h = await prisma.swap.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - ONE_DAY),
      },
    },
  })

  const pools = rawPools.map((pool) => {
    const tokenX = tokens.find((token) => token.id === pool.tokenXAddress)
    const tokenY = tokens.find((token) => token.id === pool.tokenYAddress)
    const exchanges = exchanges24h.filter((d) => d.poolAddress === pool.id)
    const { reserveX, reserveY } = pool

    const tokenPriceX = tokenPrices.find((t) => isSameAddress(t.id, tokenX?.id))
    const tokenPriceY = tokenPrices.find((t) => isSameAddress(t.id, tokenY?.id))
    const priceX = Number(tokenPriceX?.price) || 0
    const priceY = Number(tokenPriceY?.price) || 0

    if (pool.type === 'CPMM') {
      if (!Number(reserveX) || !Number(reserveY)) {
        console.warn('Reserve not found', pool.id)
        return
      }
    }
    if (!tokenX) {
      console.warn('TokenX not found', pool.tokenXAddress)
      return
    }

    if (!tokenY) {
      console.warn('TokenY not found', pool.tokenYAddress)
      return
    }

    const priceXUsd = getPriceUsd(tokenX?.symbol)
    const priceYUsd = getPriceUsd(tokenY?.symbol)

    let reserveData = {}

    if (pool.type === 'CLMM') {
      const poolBins = bins.filter((bin) => bin.poolAddress === pool.id)

      reserveData = {
        reserveX: poolBins
          .reduce((acc, bin) => acc + BigInt(bin.reserveX), BigInt(0))
          .toString(),
        reserveY: poolBins
          .reduce((acc, bin) => acc + BigInt(bin.reserveY), BigInt(0))
          .toString(),
        totalSupply: pool.lpSupply,
      }
    } else {
      reserveData = {
        reserveX: pool.reserveX,
        reserveY: pool.reserveY,
        totalSupply: pool.lpSupply,
      }
    }

    // total usd price of pool reserve
    const totalPrice =
      priceX * Number(formatUnits(BigInt(pool.reserveX), tokenX?.decimals)) +
      priceY * Number(formatUnits(BigInt(pool.reserveY), tokenY?.decimals))

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
    const volumeUsd = exchanges.reduce((acc, exchange) => {
      return acc + Number(exchange.volumeUsd)
    }, 0)

    return {
      ...pool,
      tokenX: {
        ...tokenX,
        priceUsd: priceXUsd,
      },
      tokenY: {
        ...tokenY,
        priceUsd: priceYUsd,
      },
      ...reserveData,
      liquidityUsd: totalPrice, // tvl
      volumeUsd, // 24h volume (sum of all exchanges)
      feeUsd,
      // TODO: imple apy
      apy: 12.16,
    }
  })
  return res.json(compact(pools))
})

export default router
