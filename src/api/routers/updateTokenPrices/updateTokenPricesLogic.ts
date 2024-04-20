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
  uniqBy,
} from 'lodash'

import prisma from 'src/clients/prisma'
import { isSameAddress } from 'src/utils/address'

const getUSDPrice = (data: any) => data?.quote?.USD?.price || 0
const getPrice = async () => {
  try {
    const response = await axios.get(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=TON,JUSDT,JUSDC',
      {
        headers: {
          'X-CMC_PRO_API_KEY': process.env.COINMARKET_CAP_API_KEY,
        },
      },
    )
    const { data } = response.data
    const TON = getUSDPrice(data.TON)
    const JUSDT = getUSDPrice(data.JUSDT)
    const JUSDC = getUSDPrice(data.JUSDC)

    return { TON, JUSDT, JUSDC }
  } catch (e) {
    console.warn('Error fetching price data from CoinMarketCap:')
    return {
      TON: 0,
      JUSDT: 0,
      JUSDC: 0,
    }
  }
}

// TODO: use quote historical v3 api
export const updateBaseTokenPrices = async () => {
  const prices = await getPrice()
  const tonPrice = String(prices.TON)
  const TON_WALLET_ADDRESS = process.env.TON_WALLET_ADDRESS as string
  await prisma.tokenPrice.create({
    data: {
      id: TON_WALLET_ADDRESS,
      tokenSymbol: 'TON',
      price: tonPrice,
      timestamp: new Date(),
    },
  })

  // // TODO: remove
  // await prisma.tokenPrice.create({
  //   data: {
  //     id: 'EQDJHdS-w9CCllpU6kOAUzZrhS86mKcImCdfuqcF-r1nN5zU',
  //     tokenSymbol: 'TON',
  //     price: tonPrice,
  //   },
  // })
}
const updateTokenPricesLogic = async (timestamp?: Date) => {
  const TON_WALLET_ADDRESS = process.env.TON_WALLET_ADDRESS as string
  const rawPools = (await prisma.pool.findMany()) as Pool[]
  const pools = rawPools.filter(
    (pool) => Number(pool.reserveX) && Number(pool.reserveY),
  )
  const tokens = (await prisma.token.findMany()) as Token[]
  const tokenPrices = await prisma.tokenPrice.findMany()

  const tonPrice = Number(find(tokenPrices, { id: TON_WALLET_ADDRESS })?.price)
  if (!tonPrice) {
    console.warn('TON price is not found.')
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

  // const TON_WALLET_ADDRESSES = [
  //   TON_WALLET_ADDRESS,
  //   'EQDJHdS-w9CCllpU6kOAUzZrhS86mKcImCdfuqcF-r1nN5zU',
  // ]
  // const poolHasTON = filter(
  //   pools,
  //   (pool) =>
  //     TON_WALLET_ADDRESSES.includes(pool.tokenXAddress) ||
  //     TON_WALLET_ADDRESSES.includes(pool.tokenYAddress),
  // )
  // let poolNotHaveTON = filter(
  //   pools,
  //   (pool) =>
  //     !TON_WALLET_ADDRESSES.includes(pool.tokenXAddress) &&
  //     !TON_WALLET_ADDRESSES.includes(pool.tokenYAddress),
  // )

  const poolHasTON = filter(
    pools,
    (pool) =>
      isSameAddress(pool.tokenXAddress, TON_WALLET_ADDRESS) ||
      isSameAddress(pool.tokenYAddress, TON_WALLET_ADDRESS),
  )
  let poolNotHaveTON = filter(
    pools,
    (pool) =>
      !isSameAddress(pool.tokenXAddress, TON_WALLET_ADDRESS) &&
      !isSameAddress(pool.tokenYAddress, TON_WALLET_ADDRESS),
  )

  const tokenPricesWithTonPool = map(poolHasTON, (pool) => {
    const tokenX = tokensMap[pool.tokenXAddress]
    const tokenY = tokensMap[pool.tokenYAddress]
    if (!tokenX || !tokenY) {
      return
    }
    // const xIsTON = TON_WALLET_ADDRESSES.includes(pool.tokenXAddress)
    // const yIsTON = TON_WALLET_ADDRESSES.includes(pool.tokenYAddress)

    const xIsTON = isSameAddress(tokenX.id, TON_WALLET_ADDRESS)
    const yIsTON = isSameAddress(tokenY.id, TON_WALLET_ADDRESS)
    if (!xIsTON && !yIsTON) {
      return
    }

    const quote = xIsTON ? tokenY : tokenX
    const { id, symbol } = quote
    const ratio = xIsTON
      ? Number(pool.reserveX) / Number(pool.reserveY)
      : Number(pool.reserveY) / Number(pool.reserveX)

    return {
      id,
      tokenSymbol: symbol,
      price: tonPrice * ratio,
      timestamp: timestamp || new Date(),
    }
  })

  // group to reference
  const newTokenPrices = compact(tokenPricesWithTonPool)

  // BFS
  // newTokenPrices <- reference prices
  // poolNotHaveTON <- target pools
  // loop until all target pools are indexed
  // if cannot index any more, break
  let flag = true
  while (flag) {
    const beforeLength = poolNotHaveTON.length
    forEach(poolNotHaveTON, (pool) => {
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
      poolNotHaveTON = filter(
        poolNotHaveTON,
        (p) => !isSameAddress(p.id, pool.id),
      )
    })
    // if cannot index any more, break
    if (isEmpty(poolNotHaveTON)) {
      flag = false
    }
    if (beforeLength === poolNotHaveTON.length) {
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
