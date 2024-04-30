import { TokenPrice } from '@prisma/client'
import { NextFunction, Request, Response, Router } from 'express'
import { query, validationResult } from 'express-validator'

import prisma from 'src/clients/prisma'

const router = Router()

function getMilliseconds(range: string) {
  switch (range) {
    case '5m':
      return 5 * 60 * 1000
    case '30m':
      return 30 * 60 * 1000
    case '1h':
      return 60 * 60 * 1000
    case '1d':
      return 24 * 60 * 60 * 1000
    case '7d':
      return 7 * 24 * 60 * 60 * 1000
    default:
      return 30 * 60 * 1000 // 30m
  }
}

const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg })
  }
  next()
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

router.get(
  '/token-prices-history',
  operationValidationRules,
  async (req: Request, res: Response) => {
    const { tokenIds } = req.query as { tokenIds: string[] }
    const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds]
    const range = req.query.range as string

    const interval = getMilliseconds(range)

    const allTokenPrices = await prisma.tokenPrice.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    })

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
        if (lastTime === 0 || currentTimestamp >= lastTime + interval) {
          filteredPrices.push(price)
          lastTime = currentTimestamp
        }
      })
    })

    return res.json(filteredPrices)
  },
)

export default router
