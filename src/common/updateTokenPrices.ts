import { Pool, Token } from '@prisma/client'
import axios from 'axios'
import {
  compact,
  filter,
  find,
  forEach,
  isEmpty,
  map,
  reduce,
  sortBy,
  uniqBy,
} from 'lodash'

import prisma from 'src/clients/prisma'
import getLatestTokenPrices from 'src/common/tokenPrice'
import { isSameAddress } from 'src/utils/address'
import { error, logError } from 'src/utils/log'
import sleep from 'src/utils/sleep'

const ONE_MINUTE = 60 * 1000
let lastUpdated = 0
export const updateTokenPrices = async (time: number) => {
  if (time <= lastUpdated + ONE_MINUTE) {
    return
  }
  lastUpdated = time
  await updateBaseTokenPrices(new Date(time))
  await updateQuoteTokenPrices(new Date(time))
}

const getUSDPrice = (data: any) => data?.quote?.USD?.price || 0
const getPrice = async () => {
  try {
    const response = await axios.get(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=TON,USDT',
      {
        headers: {
          'X-CMC_PRO_API_KEY': process.env.COINMARKET_CAP_API_KEY,
        },
      },
    )
    const { data } = response.data
    const TON = getUSDPrice(data.TON)
    const USDT = getUSDPrice(data.USDT)

    return { TON, USDT }
  } catch (e) {
    error('Error fetching price data from CoinMarketCap:')
    logError(e)
    sleep(2000)
    return {
      TON: 5,
      USDT: 1,
    }
  }
}

// TODO: use quote historical v3 api
export const updateBaseTokenPrices = async (ts?: Date) => {
  const prices = await getPrice()
  const tonPrice = String(prices.TON)
  const usdtPrice = String(prices.USDT)
  const TON_WALLET_ADDRESS = process.env.TON_WALLET_ADDRESS as string
  const USDT_WALLET_ADDRESS = process.env.USDT_WALLET_ADDRESS as string
  const timestamp = ts || new Date()
  await prisma.tokenPrice.upsert({
    where: {
      timestamp_id: {
        id: TON_WALLET_ADDRESS,
        timestamp,
      },
    },
    update: {
      price: tonPrice,
    },
    create: {
      id: TON_WALLET_ADDRESS,
      tokenSymbol: 'TON',
      price: tonPrice,
      timestamp,
    },
  })
  await prisma.tokenPrice.upsert({
    where: {
      timestamp_id: {
        id: USDT_WALLET_ADDRESS,
        timestamp,
      },
    },
    update: {
      price: usdtPrice,
    },
    create: {
      id: USDT_WALLET_ADDRESS,
      tokenSymbol: 'USDT',
      price: usdtPrice,
      timestamp,
    },
  })
}
const updateQuoteTokenPrices = async (timestamp?: Date) => {
  const TON_WALLET_ADDRESS = process.env.TON_WALLET_ADDRESS as string
  const USDT_WALLET_ADDRESS = process.env.USDT_WALLET_ADDRESS as string
  const rawPools = (await prisma.pool.findMany()) as Pool[]
  const pools = rawPools.filter(
    (pool) => Number(pool.reserveX) && Number(pool.reserveY),
  )

  const tokens = (await prisma.token.findMany()) as Token[]
  const tokenPrices = await getLatestTokenPrices()
  const sortedTokenPrices = sortBy(tokenPrices, 'timestamp').reverse() // to get latest price

  const tonPrice = Number(
    find(sortedTokenPrices, { id: TON_WALLET_ADDRESS })?.price,
  )
  const usdtPrice = Number(
    find(sortedTokenPrices, { id: USDT_WALLET_ADDRESS })?.price,
  )
  if (!tonPrice || !usdtPrice) {
    console.warn('TON or USDT price is not found.')
    return
  }

  const tokensMap = reduce(
    tokens,
    (acc, token) => {
      const { id } = token
      return { ...acc, [id]: token }
    },
    {},
  ) as Record<string, Token>

  const baseTokenAddrs = [TON_WALLET_ADDRESS, USDT_WALLET_ADDRESS]
  const poolsHaveBase = [] as Pool[]
  let poolsNotHaveBase = [] as Pool[]

  forEach(pools, (pool) => {
    const { tokenXAddress, tokenYAddress } = pool
    const hasBase = baseTokenAddrs.find(
      (addr) =>
        isSameAddress(addr, tokenXAddress) ||
        isSameAddress(addr, tokenYAddress),
    )
    if (hasBase) {
      poolsHaveBase.push(pool)
    } else {
      poolsNotHaveBase.push(pool)
    }
  })

  const checkTokenIsBase = (token: Token) => {
    return (
      isSameAddress(token.id, TON_WALLET_ADDRESS) ||
      isSameAddress(token.id, USDT_WALLET_ADDRESS)
    )
  }

  const tokenPricesInBasePool = map(poolsHaveBase, (pool) => {
    const { tokenXAddress, tokenYAddress, reserveX, reserveY } = pool
    const tokenX = tokensMap[tokenXAddress]
    const tokenY = tokensMap[tokenYAddress]
    if (!tokenX || !tokenY) {
      return
    }
    const xIsBase = checkTokenIsBase(tokenX)
    const yIsBase = checkTokenIsBase(tokenY)
    if (!xIsBase && !yIsBase) {
      return
    }
    if (xIsBase && yIsBase) {
      // TON - USDT pool
      return
    }

    const quote = xIsBase ? tokenY : tokenX
    const { id, symbol } = quote

    const price = calcQuoteTokenPrice({
      baseTokenPrice: tonPrice,
      baseTokenReserve: xIsBase ? Number(reserveX) : Number(reserveY),
      baseTokenDecimals: xIsBase ? tokenX.decimals : tokenY.decimals,
      quoteTokenReserve: xIsBase ? Number(reserveY) : Number(reserveX),
      quoteTokenDecimals: xIsBase ? tokenY.decimals : tokenX.decimals,
    })

    return {
      id,
      tokenSymbol: symbol,
      price,
      timestamp: timestamp || new Date(),
    }
  })

  // group to reference
  const newTokenPrices = compact(tokenPricesInBasePool)

  // BFS
  // newTokenPrices <- reference prices
  // poolsNotHaveBase <- target pools
  // loop until all target pools are indexed
  // if cannot index any more, break
  let flag = true
  while (flag) {
    const beforeLength = poolsNotHaveBase.length
    forEach(poolsNotHaveBase, (pool) => {
      const tokenX = tokensMap[pool.tokenXAddress]
      const tokenY = tokensMap[pool.tokenYAddress]
      const tokenXIndexed = find(newTokenPrices, { id: tokenX.id })
      const tokenYIndexed = find(newTokenPrices, { id: tokenY.id })
      const indexed = tokenXIndexed || tokenYIndexed
      if (!indexed) {
        // skip if not indexed
        return
      }

      const quote = tokenXIndexed ? tokenY : tokenX
      const { id, symbol } = quote

      const price = calcQuoteTokenPrice({
        baseTokenPrice: indexed.price,
        baseTokenReserve: tokenXIndexed
          ? Number(pool.reserveX)
          : Number(pool.reserveY),
        baseTokenDecimals: tokenXIndexed ? tokenX.decimals : tokenY.decimals,
        quoteTokenReserve: tokenXIndexed
          ? Number(pool.reserveY)
          : Number(pool.reserveX),
        quoteTokenDecimals: tokenXIndexed ? tokenY.decimals : tokenX.decimals,
      })

      const tokenPrice = {
        id,
        tokenSymbol: symbol,
        price,
        timestamp: timestamp || new Date(),
      }
      // add to reference pools
      newTokenPrices.push(tokenPrice)
      // remove from target pools
      poolsNotHaveBase = filter(
        poolsNotHaveBase,
        (p) => !isSameAddress(p.id, pool.id),
      )
    })
    // if cannot index any more, break
    if (isEmpty(poolsNotHaveBase)) {
      flag = false
    }
    if (beforeLength === poolsNotHaveBase.length) {
      flag = false
    }
  }

  const uniqTokenPrices = uniqBy(newTokenPrices, 'id')
  await bulkInsertTokenPrices(uniqTokenPrices)
}

async function bulkInsertTokenPrices(
  tokenPrices: {
    id: string
    tokenSymbol: string
    price: number
    timestamp: Date
  }[],
) {
  if (isEmpty(tokenPrices)) {
    return
  }

  const values = tokenPrices
    .map((tp) => {
      const { id, tokenSymbol, price, timestamp } = tp
      return `('${id}', '${tokenSymbol}', '${String(price).replace(/'/g, "''")}', '${timestamp.toISOString()}')`
    })
    .join(',')

  const query = `
    INSERT INTO "TokenPrice" (id, "tokenSymbol", "price", "timestamp")
    VALUES ${values}
    ON CONFLICT ("id", "timestamp") DO NOTHING;
  `

  await prisma.$executeRawUnsafe(query)
}

export default updateQuoteTokenPrices

const calcQuoteTokenPrice = ({
  baseTokenPrice,
  baseTokenReserve,
  quoteTokenReserve,
  baseTokenDecimals,
  quoteTokenDecimals,
}: {
  baseTokenPrice: number
  baseTokenReserve: number
  baseTokenDecimals: number
  quoteTokenReserve: number
  quoteTokenDecimals: number
}) => {
  if (quoteTokenReserve === 0) {
    return 0
  }
  const ratio = baseTokenReserve / quoteTokenReserve
  const decimals = quoteTokenDecimals - baseTokenDecimals
  const quoteTokenPrice = baseTokenPrice * ratio * Math.pow(10, decimals)
  return quoteTokenPrice
}
