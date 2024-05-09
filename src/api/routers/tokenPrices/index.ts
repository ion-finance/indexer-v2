import { TokenPrice } from '@prisma/client'
import { Request, Response, Router } from 'express'
import { query } from 'express-validator'
import { filter, isEmpty } from 'lodash'

import prisma from 'src/clients/prisma'
import { validate } from 'src/common/expressValidator'

const router = Router()

const operationValidationRules = [
  query('tokenIds')
    .optional()
    .isArray()
    .withMessage('TokenIds must be an array')
    .custom((tokenIds) =>
      // Further custom validation to check each item in the array is a string
      tokenIds.every((tokenId: string) => typeof tokenId === 'string'),
    )
    .withMessage('Each tokenId must be a string'),

  validate,
]

router.get(
  '/token-prices',
  operationValidationRules,
  async (req: Request, res: Response) => {
    const { tokenIds } = req.query as { tokenIds: string[] }

    // get latest token prices
    const latestTokenPrices = (await prisma.$queryRaw`
      SELECT DISTINCT ON (id) *
      FROM "TokenPrice"
      ORDER BY id, timestamp DESC;
    `) as TokenPrice[]

    const hasFilter = !isEmpty(tokenIds)
    const data = hasFilter
      ? filter(latestTokenPrices, (tokenPrice: TokenPrice) =>
          tokenIds.includes(tokenPrice.id),
        )
      : latestTokenPrices

    return res.json(data)
  },
)

export default router
