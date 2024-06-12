import { TokenPrice } from '@prisma/client'
import { Request, Response, Router } from 'express'
import { query } from 'express-validator'

import prisma from 'src/clients/prisma'
import { validate } from 'src/common/expressValidator'
import { getUsdtIdFromTonUsdtPool } from 'src/utils/address'

const router = Router()

// timestamp consider milliseconds,
// so set buffer 1s to consider in seconds range
const BUFFER = 1000 // 1s
function getMilliseconds(range: string) {
  switch (range) {
    case '1m':
      return 1 * 60 * 1000 // 1m
    case '5m':
      return 5 * 60 * 1000 // 5m
    case '10m':
      return 10 * 60 * 1000 // 10m
    case '15m':
      return 15 * 60 * 1000 // 15m
    case '30m':
      return 30 * 60 * 1000 // 30m
    case '1h':
      return 1 * 60 * 60 * 1000 // 1h
    case '1d':
      return 1 * 24 * 60 * 60 * 1000 // 1d
    case '7d':
      return 7 * 24 * 60 * 60 * 1000 // 7d
    default:
      return 30 * 60 * 1000 // 30m
  }
}

const operationValidationRules = [
  query('tokenIds')
    .custom((value) => {
      // Convert single string to an array
      if (typeof value === 'string') {
        return [value]
      }
      return Array.isArray(value)
    })
    .withMessage('TokenIds must be an array or a single string'),
  query('range').optional().isString().withMessage('Range must be a string'),
  validate,
]

function checkIsTonUsdtPool(ids: string[]) {
  return (
    ids.length === 2 &&
    ids.findIndex(
      (id) => id === (process.env.USDT_WALLET_ADDRESS as string),
    ) !== -1 &&
    ids.findIndex((id) => id === (process.env.TON_WALLET_ADDRESS as string)) !==
      -1
  )
}

function changeIdAndSymbolOfUSDT(array: TokenPrice[]) {
  return array.map((obj) => {
    if (obj.id === getUsdtIdFromTonUsdtPool()) {
      return {
        ...obj,
        id: process.env.USDT_WALLET_ADDRESS as string,
        tokenSymbol: 'USDT',
      }
    } else {
      return obj
    }
  })
}

router.get(
  '/token-prices-history',
  operationValidationRules,
  async (req: Request, res: Response) => {
    const { tokenIds } = req.query as { tokenIds: string[] }
    const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds]
    const range = req.query.range as string

    const interval = getMilliseconds(range)
    const isTonUsdtPool = checkIsTonUsdtPool(ids)

    if (isTonUsdtPool) {
      // change id to query USDT(TON-USDT)
      const idx = ids.findIndex(
        (id) => id === (process.env.USDT_WALLET_ADDRESS as string),
      )
      ids[idx] = getUsdtIdFromTonUsdtPool()
    }

    let allTokenPrices = await prisma.tokenPrice.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    })

    if (isTonUsdtPool) {
      // remove prefix(POOL-) of id and postfix(TON-USD) of symbol
      allTokenPrices = changeIdAndSymbolOfUSDT(allTokenPrices)
    }

    const groupedByTokenId = {} as { [key: string]: TokenPrice[] }
    // group
    allTokenPrices.forEach((price) => {
      const tokenId = price.id
      if (!groupedByTokenId[tokenId]) {
        groupedByTokenId[tokenId] = []
      }
      groupedByTokenId[tokenId].push(price)
    })

    const filteredPrices = [] as TokenPrice[]
    if (!range) {
      return res.json(allTokenPrices)
    }

    Object.keys(groupedByTokenId).forEach((tokenId) => {
      let lastTime = 0
      const tokenPrices = groupedByTokenId[tokenId]
      tokenPrices.forEach((price) => {
        const currentTimestamp = new Date(price.timestamp).getTime()
        if (
          lastTime === 0 ||
          currentTimestamp + BUFFER >= lastTime + interval
        ) {
          filteredPrices.push(price)
          lastTime = currentTimestamp
        }
      })
    })

    return res.json(filteredPrices)
  },
)

export default router
