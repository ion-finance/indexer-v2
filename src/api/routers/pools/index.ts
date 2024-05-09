import { Swap } from '@prisma/client'
import BigNumber from 'bignumber.js'
import { Router } from 'express'
import { compact, filter, isEmpty } from 'lodash'
import moment from 'moment'

import prisma from 'src/clients/prisma'
import getLatestTokenPrices from 'src/common/tokenPrice'
import { FEE_DIVIDER, LP_FEE } from 'src/dex/simulate/contant'
import { isSameAddress } from 'src/utils/address'
import { bFormatUnits } from 'src/utils/bigNumber'

const router = Router()
const alreadyWarnedReserve = new Set<string>()
const alreadyWarnedTokenX = new Set<string>()
const alreadyWarnedTokenY = new Set<string>()

router.get('/pools', async function handler(req, res) {
  const rawPools = await prisma.pool.findMany()
  const tokens = await prisma.token.findMany()
  const bins = await prisma.bins.findMany()
  const tokenPrices = await getLatestTokenPrices()

  const exchanges30d = await prisma.swap.findMany({
    where: {
      timestamp: {
        gte: moment().subtract(30, 'days').toDate(),
      },
    },
  })
  const exchanges7d = await prisma.swap.findMany({
    where: {
      timestamp: {
        gte: moment().subtract(7, 'days').toDate(),
      },
    },
  })
  const exchanges1d = await prisma.swap.findMany({
    where: {
      timestamp: {
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
    const priceX = BigNumber(tokenPriceX?.price || 0)
    const priceY = BigNumber(tokenPriceY?.price || 0)

    if (type === 'CPMM') {
      if (BigNumber(reserveX).isZero() || BigNumber(reserveY).isZero()) {
        if (!alreadyWarnedReserve.has(pool.id)) {
          console.warn('Reserve not found', pool.id)
          alreadyWarnedReserve.add(pool.id)
        }
        return
      }
    }
    if (!tokenX) {
      if (!alreadyWarnedTokenX.has(tokenXAddress)) {
        console.warn('TokenX not found', tokenXAddress)
        alreadyWarnedTokenX.add(tokenXAddress)
      }
      return
    }

    if (!tokenY) {
      if (!alreadyWarnedTokenY.has(tokenYAddress)) {
        console.warn('TokenY not found', tokenYAddress)
        alreadyWarnedTokenY.add(tokenYAddress)
      }
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
    const tvl = priceX
      .multipliedBy(bFormatUnits(BigNumber(reserveX), tokenX?.decimals || 0))
      .plus(
        priceY.multipliedBy(
          bFormatUnits(BigNumber(reserveY), tokenY?.decimals || 0),
        ),
      )

    // total usd price of pool collected protocol fee
    // const feeUsd =
    //   priceX *
    //     Number(
    //       formatUnits(BigInt(pool.collectedXProtocolFee), tokenX?.decimals),
    //     ) +
    //   priceY *
    //     Number(
    //       formatUnits(BigInt(pool.collectedYProtocolFee), tokenY?.decimals),
    //     )

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
      // feeUsd,
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
  priceX: BigNumber,
  priceY: BigNumber,
  decimalsX: number,
  decimalsY: number,
) => {
  if (
    isEmpty(exchanges) ||
    priceX.isZero() ||
    priceY.isZero() ||
    !decimalsX ||
    !decimalsY
  ) {
    return BigNumber(0)
  }

  const sum = exchanges.reduce((acc, exchange) => {
    return acc.plus(exchange.volumeUsd)
  }, BigNumber(0))
  return sum

  // let tokenXAmount = BigNumber(0)
  // let tokenYAmount = BigNumber(0)

  // exchanges.forEach((exchange) => {
  //   const { amountIn, swapForY } = exchange
  //   if (swapForY) {
  //     tokenYAmount = tokenYAmount.plus(amountIn)
  //   } else {
  //     tokenXAmount = tokenXAmount.plus(amountIn)
  //   }
  // })

  // return priceX
  //   .multipliedBy(bFormatUnits(tokenXAmount, decimalsX))
  //   .plus(priceY.multipliedBy(bFormatUnits(tokenYAmount, decimalsY)))
}

const getApy = (
  volumeUsd: BigNumber,
  tvl: BigNumber,
  timestampForYear: number,
) => {
  if (volumeUsd.isZero() || tvl.isZero() || timestampForYear === 0) {
    return 0
  }
  return (
    volumeUsd
      .div(tvl)
      // .multipliedBy(1 - LP_FEE / FEE_DIVIDER)
      .multipliedBy(LP_FEE / FEE_DIVIDER)
      .multipliedBy(timestampForYear)
      .div(100)
      .toNumber()
  )
}
