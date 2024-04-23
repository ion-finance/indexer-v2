import { Pool, PrismaClient, Token } from '@prisma/client'
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
import { isSameAddress } from 'src/utils/address'

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
    console.warn('Error fetching price data from CoinMarketCap:')
    return {
      TON: 0,
      USDT: 0,
    }
  }
}

// TODO: use quote historical v3 api
export const updateBaseTokenPrices = async () => {
  const prices = await getPrice()
  const tonPrice = String(prices.TON)
  const usdtPrice = String(prices.USDT)
  const TON_WALLET_ADDRESS = process.env.TON_WALLET_ADDRESS as string
  const USDT_WALLET_ADDRESS = process.env.USDT_WALLET_ADDRESS as string
  await prisma.tokenPrice.create({
    data: {
      id: TON_WALLET_ADDRESS,
      tokenSymbol: 'TON',
      price: tonPrice,
      timestamp: new Date(),
    },
  })
  await prisma.tokenPrice.create({
    data: {
      id: USDT_WALLET_ADDRESS,
      tokenSymbol: 'USDT',
      price: usdtPrice,
      timestamp: new Date(),
    },
  })
}
const updateTokenPricesLogic = async (timestamp?: Date) => {
  const TON_WALLET_ADDRESS = process.env.TON_WALLET_ADDRESS as string
  const USDT_WALLET_ADDRESS = process.env.USDT_WALLET_ADDRESS as string
  const rawPools = (await prisma.pool.findMany()) as Pool[]
  const pools = rawPools.filter(
    (pool) => Number(pool.reserveX) && Number(pool.reserveY),
  )

  const tokens = (await prisma.token.findMany()) as Token[]
  const tokenPrices = await prisma.tokenPrice.findMany()
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

    const ratio = xIsBase
      ? Number(reserveX) / Number(reserveY)
      : Number(reserveY) / Number(reserveX)

    return {
      id,
      tokenSymbol: symbol,
      price: tonPrice * ratio,
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
      const ratio = tokenXIndexed
        ? Number(pool.reserveX) / Number(pool.reserveY)
        : Number(pool.reserveY) / Number(pool.reserveX)

      const tokenPrice = {
        id,
        tokenSymbol: symbol,
        price: indexed.price * ratio,
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
  const prisma = new PrismaClient()
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

export default updateTokenPricesLogic
