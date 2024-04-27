import { Token } from '@prisma/client'
import { compact, sortBy } from 'lodash'

import prisma from 'src/clients/prisma'
import { isTONAddress } from 'src/utils/address'
import { ONE_DAY } from 'src/utils/date'

import router from '../pools'

// only consider TON-JETTON pair
// TODO: consider JETTON-JETTON pair
router.get('/trending-assets', async function handler(req, res) {
  const pools = await prisma.pool.findMany()
  const tokens = await prisma.token.findMany()
  const tokenPrices = await prisma.tokenPrice.findMany()

  const tokensMap = tokens.reduce(
    (acc, token) => {
      return {
        ...acc,
        [token.id]: token,
      }
    },
    {} as { [key: string]: Token },
  )

  const exchanges24h = await prisma.swap.findMany({
    where: {
      timestamp: {
        gte: new Date(Date.now() - ONE_DAY),
      },
    },
  })

  const poolsWithVolume = pools.map((pool) => {
    const exchanges = exchanges24h.filter((d) => d.poolAddress === pool.id)
    // To use lodash 'sortby', use BigInt instead of BigNumber
    const volumeUsd = exchanges.reduce((acc, exchange) => {
      return acc + BigInt(exchange.volumeUsd)
    }, BigInt(0))
    return { ...pool, volumeUsd }
  })

  const topPools = sortBy(poolsWithVolume, 'volumeUsd').reverse().slice(0, 10)
  const topTokens = topPools.map((pool) => {
    const { tokenXAddress, tokenYAddress } = pool
    const xIsTON = isTONAddress(tokenXAddress)
    const yIsTON = isTONAddress(tokenYAddress)
    if (!xIsTON && !yIsTON) {
      return null
    }
    const tokenAddress = xIsTON ? tokenYAddress : tokenXAddress
    const exchanges = exchanges24h.filter((d) => d.poolAddress === pool.id)
    const volumeUsd = exchanges.reduce((acc, exchange) => {
      return acc + BigInt(exchange.volumeUsd)
    }, BigInt(0))
    if (volumeUsd === BigInt(0)) {
      return null
    }
    const token = tokensMap[tokenAddress]
    const prices = tokenPrices.filter((d) => d.id === tokenAddress)
    const recentPrice = prices[prices.length - 1]

    const oneDayAgoPrice = prices
      .reverse()
      .find((d) => d.timestamp <= new Date(new Date().getTime() - ONE_DAY))

    const agoPrice = oneDayAgoPrice
      ? Number(oneDayAgoPrice.price)
      : Number(prices[0].price)

    const priceChange24h = Number(recentPrice.price) - agoPrice
    return {
      token,
      volumeUsd,
      price: Number(recentPrice.price),
      change: priceChange24h,
    }
  })
  const uniqTokenAddress = compact(topTokens)
  return res.json(uniqTokenAddress)
})

export default router
