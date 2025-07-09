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

// !NOTE
// these pools only have one reserve by mistake.
// we'll not provide the way to fix this.
// just ignore them by hardcoding
const misIndexedPoolIds = [
  'EQCJ2mpHWEbu6ZMnWmkmdT-eWtrNm2Azo9Ecz7Ll_hR1z_FQ',
  'EQA-fCMn2bej12BzhWR9Y9GbzwQ4YYLrLqazYhxI7MfcshNf',
  'EQDIx53YTk59Nl-amPuNaFwUjmo5k2YvBI8OpC4H6QfnnN69',
  'EQDTeSMqHgouJcnNF9iqhpxwi-fw-mYG-YG_5c-ZdrEJhClH',
  'EQA51NdwasYs4tM-0bQ6Oyo7sI0tsdQxr9b4etP4V6eNli_x',
  'EQC-j6zOT6pJRxq7ngeeIhd4r9E1k_iAsi8xfj5ZYkcr4sKS',
]

router.get('/pools', async function handler(req, res) {
  const rawPools = await prisma.pool.findMany()
  console.log(`pools: ${rawPools.length}`)
  const tokens = await prisma.token.findMany()
  console.log(`tokens: ${tokens.length}`)

  const pools = rawPools.map((pool) => {
    const { reserveX, reserveY, tokenXAddress, tokenYAddress, type, lpSupply } =
      pool
    const tokenX = tokens.find((token) => token.id === tokenXAddress)
    const tokenY = tokens.find((token) => token.id === tokenYAddress)

    let reserveData = {}

    if (type === 'CLMM') {
      return
    } else {
      reserveData = {
        reserveX,
        reserveY,
        totalSupply: lpSupply,
      }
    }

    // total usd price of pool reserve

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

    return {
      ...pool,
      tokenX,
      tokenY,
      ...reserveData,
      tvl: 0,
      volumeUsd: 0, // 24h volume (sum of all exchanges)
      volumeUsd7d: 0,
      volumeUsd30d: 0,
      // feeUsd,
      apy: 0,
      apy7d: 0,
      apy30d: 0,
    }
  })

  console.log(`final pools: ${pools.length}`)

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
