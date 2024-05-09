import { Prisma } from '@prisma/client'
import { Request, Response, Router } from 'express'
import { query } from 'express-validator'
import { orderBy } from 'lodash'

import prisma from 'src/clients/prisma'
import { validate } from 'src/common/expressValidator'

const router = Router()

const operationValidationRules = [
  query('poolAddress')
    .isString()
    .optional()
    .withMessage('poolAddress must be an string'),
  query('ownerAddress')
    .isString()
    .optional()
    .withMessage('ownerAddress must be an string'),
  validate,
]

router.get(
  '/orders',
  operationValidationRules,
  async (req: Request, res: Response) => {
    const { poolAddress, ownerAddress } = req.query

    const query = {} as Prisma.OrderWhereInput

    if (!poolAddress && !ownerAddress) {
      return res.json({
        status: 'bad request',
        data: [],
      })
    }

    if (poolAddress) {
      query.poolAddress = poolAddress as string
    }
    if (ownerAddress) {
      query.ownerAddress = ownerAddress as string
    }

    const orders = await prisma.order.findMany({ where: query })
    const sorted = orderBy(orders, ['timestamp'], ['desc'])

    return res.json({
      // TODO
      // 1. pagenation
      data: sorted,
    })
  },
)

export default router
