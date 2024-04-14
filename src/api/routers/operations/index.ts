import { NextFunction, Request, Response, Router } from 'express'
import prisma from '../../../clients/prisma'
import { query, validationResult } from 'express-validator'

const router = Router()

const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg })
  }
  next()
}

const operationValidationRules = [
  query('page')
    .optional()
    .isNumeric()
    .toInt()
    .withMessage('Page must be a positive integer.'),
  query('pageSize')
    .optional()
    .isNumeric()
    .toInt()
    .withMessage('PageSize must be a positive integer.'),
  query('since')
    .optional()
    .isISO8601()
    .withMessage('Since must be a valid ISO 8601 date.'),
  query('until')
    .optional()
    .isISO8601()
    .withMessage('Until must be a valid ISO 8601 date.'),
  //ex) 2024-04-12, 2024-04-12T14:30:00Z, 2024-04-12T14:30:00+09:00
  query('poolAddress')
    .optional()
    .isString()
    .withMessage('Pool address must be a valid string.'),
  query('destinationWalletAddress')
    .optional()
    .isString()
    .withMessage('Destination wallet address must be a valid string.'),
  query('operationType')
    .optional()
    .isIn(['add_liquidity', 'send_liquidity', 'swap', 'withdraw_liquidity'])
    .withMessage(
      'Invalid operation type. Valid types include: add_liquidity, send_liquidity, swap, withdraw_liquidity.',
    ),
  validate,
]

router.get(
  '/operations',
  operationValidationRules,
  async (req: Request, res: Response) => {
    const {
      page,
      pageSize,
      since,
      until,
      poolAddress,
      destinationWalletAddress,
      operationType,
    } = req.query as {
      page?: string
      pageSize?: string
      since?: string
      until?: string
      poolAddress?: string
      destinationWalletAddress?: string
      operationType?: string
    }

    const gte = since ? new Date(String(since)) : undefined
    const lte = until ? new Date(String(until)) : undefined
    const skip = parseInt(String(page)) || 0
    const take = parseInt(String(pageSize)) || 10

    const operations = await prisma.operation.findMany({
      where: {
        poolTxTimestamp: {
          gte,
          lte,
        },
        poolAddress: poolAddress ? String(poolAddress) : undefined,
        destinationWalletAddress: destinationWalletAddress
          ? String(destinationWalletAddress)
          : undefined,
        operationType: operationType ? String(operationType) : undefined,
      },
      orderBy: {
        poolTxTimestamp: 'asc',
      },
      skip,
      take,
    })

    return res.json({
      data: operations,
    })
  },
)

export default router
