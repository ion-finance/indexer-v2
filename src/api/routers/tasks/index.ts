import { TokenPrice } from '@prisma/client'
import { NextFunction, Request, Response, Router } from 'express'
import { query, validationResult } from 'express-validator'
import { filter, isEmpty } from 'lodash'

import prisma from 'src/clients/prisma'

const router = Router()

router.get('/tasks/cpmm_beta', async function handler(req, res) {
  const { senderAddress } = req.query

  if (!senderAddress) {
    return res.json({
      status: 400,
      data: [],
    })
  }

  const query = { senderAddress: senderAddress as string }

  const [deposit, swap] = await Promise.all([
    prisma.deposit.findFirst({ where: query }),
    prisma.swap.findFirst({ where: query }),
  ])

  return res.json({
    convertContractAt: swap?.timestamp || swap?.timestamp,
    earnContractAt: deposit?.timestamp || deposit?.timestamp,
  })
})

router.get(
  '/tasks/pool-creation',
  query('creator')
    .isString()
    .notEmpty()
    .withMessage('Owner address is required'),
  async (req: Request, res: Response) => {
    const { creator } = req.query as { creator: string }

    if (!creator) {
      return res.json({
        status: 400,
        data: [],
      })
    }
    const pool = await prisma.pool.findFirst({
      where: {
        creator,
      },
    })
    if (!pool) {
      return res.json({ status: 404, data: [] })
    }
    return res.json({
      status: 200,
      data: {
        poolId: pool.id,
        creator: pool.creator,
        createdAt: pool.createdAt,
      },
    })
  },
)

export default router
