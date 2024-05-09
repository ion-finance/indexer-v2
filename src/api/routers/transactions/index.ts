import { Response, Router } from 'express'
import { param, query } from 'express-validator'
import { Request } from 'express-validator/src/base'
import _ from 'lodash'

import prisma from 'src/clients/prisma'
import { validate } from 'src/common/expressValidator'

const router = Router()

const operationValidationRules = [
  query('poolAddress')
    .optional()
    .isString()
    .withMessage('poolAddress must be an string'),
  query('senderAddress')
    .optional()
    .isString()
    .withMessage('senderAddress must be an string'),
  query('type').optional().isString().withMessage('type must be an string'),
  validate,
]

router.get(
  '/transactions',
  operationValidationRules,
  async (req: Request, res: Response) => {
    const { poolAddress, senderAddress, type } = req.query as {
      poolAddress?: string
      senderAddress?: string
      type?: string
    }

    if (!poolAddress && !senderAddress) {
      return res.json({
        status: 400,
        data: [],
      })
    }

    const query = {} as { poolAddress?: string; senderAddress?: string }

    if (poolAddress) {
      query.poolAddress = poolAddress as string
    }
    if (senderAddress) {
      query.senderAddress = senderAddress as string
    }

    const [deposit, withdraw, swap] = await Promise.all([
      !type || type === 'deposit'
        ? prisma.deposit.findMany({ where: query })
        : [],
      !type || type === 'withdraw'
        ? prisma.withdraw.findMany({ where: query })
        : [],
      !type || type === 'swap' ? prisma.swap.findMany({ where: query }) : [],
    ])

    const transactions = [
      ...deposit.map((t) => ({ ...t, type: 'add' })),
      ...withdraw.map((t) => ({ ...t, type: 'remove' })),
      ...swap.map((t) => ({ ...t, type: 'swap' })),
    ]

    return res.json({
      // TODO
      // 1. pagenation
      data: _.orderBy(
        _.values(_.groupBy(transactions, 'eventId')).map((txs) => {
          const first = _.orderBy(txs, 'timestamp', 'asc')[0]

          return {
            ...first,
            children: txs.filter((tx) => tx.id !== first.id),
          }
        }),
        'timestamp',
        'desc',
      ),
    })
  },
)

const operationValidationRules2 = [
  param('event_id').isString().withMessage('event_id must be an string'),
  validate,
]

router.get(
  '/transactions/:event_id',
  operationValidationRules2,
  async (req: Request, res: Response) => {
    const event_id = req.params?.event_id

    if (!event_id) {
      return res.json({
        status: 400,
        data: [],
      })
    }

    const query = {
      eventId: event_id as string,
    }

    const [deposit, withdraw, swap] = await Promise.all([
      prisma.deposit.findMany({ where: query }),
      prisma.withdraw.findMany({ where: query }),
      prisma.swap.findMany({ where: query }),
    ])

    const transactions = [
      ...deposit.map((t) => ({ ...t, type: 'add' })),
      ...withdraw.map((t) => ({ ...t, type: 'remove' })),
      ...swap.map((t) => ({ ...t, type: 'swap' })),
    ]

    if (!transactions.length) {
      return res.json({
        status: 400,
        data: [],
      })
    }

    return res.json({
      status: 200,
      data: transactions[0]
        ? [
            {
              ...transactions[0],
              children: transactions.slice(1),
            },
          ]
        : [],
    })
  },
)

export default router
