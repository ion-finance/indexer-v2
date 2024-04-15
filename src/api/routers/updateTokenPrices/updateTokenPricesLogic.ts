import { Pool, Token } from '@prisma/client'
import axios from 'axios'
import { compact, filter, find, forEach, map, reduce } from 'lodash'

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
    console.warn('Error fetching price data from CoinMarketCap:', e)
    return {
      TON: 0,
      JUSDT: 0,
      JUSDC: 0,
    }
  }
}

const updateTokenPricesLogic = async () => {
  const TON_WALLET_ADDRESS = process.env.TON_WALLET_ADDRESS as string
  const pools = (await prisma.pool.findMany()) as Pool[]
  const tokens = (await prisma.token.findMany()) as Token[]
  const prices = await getPrice()
  const tonPrice = prices.TON

  const tokensMap = reduce(
    tokens,
    (acc, token) => {
      const { id } = token
      return { ...acc, [id]: token }
    },
    {},
  ) as Record<string, Token>

  const poolHasTON = filter(
    pools,
    (pool) =>
      isSameAddress(pool.tokenXAddress, TON_WALLET_ADDRESS) ||
      isSameAddress(pool.tokenYAddress, TON_WALLET_ADDRESS),
  )
  const poolNotHaveTON = filter(
    pools,
    (pool) =>
      !isSameAddress(pool.tokenXAddress, TON_WALLET_ADDRESS) &&
      !isSameAddress(pool.tokenYAddress, TON_WALLET_ADDRESS),
  )

  const rawTokenPrices = map(poolHasTON, (pool) => {
    const tokenX = tokensMap[pool.tokenXAddress]
    const tokenY = tokensMap[pool.tokenYAddress]
    if (!tokenX || !tokenY) return
    const xIsTON = isSameAddress(tokenX.id, TON_WALLET_ADDRESS)
    const yIsTON = isSameAddress(tokenY.id, TON_WALLET_ADDRESS)
    if (!xIsTON && !yIsTON) return

    const quote = xIsTON ? tokenY : tokenX
    const { id, symbol } = quote
    const ratio = xIsTON
      ? Number(pool.reserveX) / Number(pool.reserveY)
      : Number(pool.reserveY) / Number(pool.reserveX)
    return {
      id,
      tokenSymbol: symbol,
      price: tonPrice * ratio,
    }
  })
  const tokenPrices = compact(rawTokenPrices)

  forEach(poolNotHaveTON, (pool) => {
    const tokenX = tokensMap[pool.tokenXAddress]
    const tokenY = tokensMap[pool.tokenYAddress]
    const tokenXIndexed = find(tokenPrices, { id: tokenX.id })
    const tokenYIndexed = find(tokenPrices, { id: tokenY.id })
    const indexed = tokenXIndexed || tokenYIndexed
    if (!indexed) return

    const quote = tokenXIndexed ? tokenY : tokenX
    const { id, symbol } = quote
    const ratio = tokenXIndexed
      ? Number(pool.reserveX) / Number(pool.reserveY)
      : Number(pool.reserveY) / Number(pool.reserveX)
    const tokenPrice = {
      id,
      tokenSymbol: symbol,
      price: indexed.price * ratio,
    }
    tokenPrices.push(tokenPrice)
  })

  tokenPrices.push({
    id: TON_WALLET_ADDRESS,
    tokenSymbol: 'TON',
    price: tonPrice,
  })

  bulkUpsertTokenPrices(prisma, tokenPrices)
}

async function bulkUpsertTokenPrices(
  prisma: any,
  tokenPrices: { id: string; tokenSymbol: string; price: number }[],
) {
  const values = tokenPrices
    .map((tp) => {
      const { id, tokenSymbol, price } = tp
      return `('${id}', '${tokenSymbol}', '${String(price).replace(/'/g, "''")}')`
    })
    .join(',')

  // PostgreSQL UPSERT syntax (ON CONFLICT DO UPDATE)
  // Assumes 'id' is the unique primary key column
  const query = `
    INSERT INTO "TokenPrice" (id, "tokenSymbol", "price")
    VALUES ${values}
    ON CONFLICT (id) DO UPDATE
    SET "tokenSymbol" = EXCLUDED."tokenSymbol", "price" = EXCLUDED."price";
  `

  await prisma.$executeRawUnsafe(query)
}

export default updateTokenPricesLogic
