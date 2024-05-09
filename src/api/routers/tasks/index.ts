import { Request, Response, Router } from 'express'
import { query } from 'express-validator'

import prisma from 'src/clients/prisma'
import { validate } from 'src/common/expressValidator'

const router = Router()
const operationValidationRules = [
  query('creator')
    .isString()
    .notEmpty()
    .withMessage('Owner address is required'),
  validate,
]

router.get(
  '/tasks/pool-creation',
  operationValidationRules,
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

const operationValidationRules2 = [
  query('senderAddress')
    .isString()
    .notEmpty()
    .withMessage('senderAddress is required'),
  validate,
]

router.get(
  '/tasks/usdt',
  operationValidationRules2,
  async (req: Request, res: Response) => {
    const { senderAddress } = req.query as { senderAddress: string }

    if (!senderAddress) {
      return res.json({
        status: 400,
        data: [],
      })
    }

    const usdtTonPoolAddress = process.env.USDT_TON_POOL_ADDRESS

    const [deposit, swap] = await Promise.all([
      prisma.deposit.findFirst({
        where: {
          senderAddress: senderAddress,
          poolAddress: usdtTonPoolAddress,
        },
      }),
      prisma.swap.findFirst({
        where: {
          senderAddress: senderAddress,
          swapForY: false, // USDT(EQAlo0UG58M-DAliBEE0d6jWX0-nveb4YU0WU4vOAsteZLn_) is token X
          poolAddress: usdtTonPoolAddress,
        },
      }),
    ])

    return res.json({
      status: 200,
      data: {
        convertUsdtAt: swap?.timestamp,
        earnUsdtAt: deposit?.timestamp,
      },
    })
  },
)

export default router
