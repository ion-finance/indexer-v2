import { Router } from 'express'
import prisma from 'src/clients/prisma'
import { Prisma } from '@prisma/client'
import _ from 'lodash'

const router = Router()

router.get('/transactions', async function handler(req, res) {
  const { poolAddress, senderAddress, type } = req.query

  const query = {} as { poolAddress?: string; senderAddress?: string }
  let orderQuery = {} as Prisma.OrderHistoryWhereInput
  prisma.orderHistory

  if (!senderAddress) {
    return res.json({
      status: 400,
      data: [],
    })
  }

  if (poolAddress) {
    query.poolAddress = poolAddress as string
    orderQuery.poolAddress = poolAddress as string
  }
  if (senderAddress) {
    query.senderAddress = senderAddress as string
    orderQuery = {
      ...orderQuery,
      AND: {
        OR: [
          { senderAddress: senderAddress as string },
          { relatedOwnerAddres: { contains: senderAddress as string } },
        ],
      },
    }
  }

  const [deposit, withdraw, swap, orderHistory] = await Promise.all([
    !type || type === 'deposit'
      ? prisma.deposit.findMany({ where: query })
      : [],
    !type || type === 'withdraw'
      ? prisma.withdraw.findMany({ where: query })
      : [],
    !type || type === 'swap' ? prisma.swap.findMany({ where: query }) : [],
    !type || type === 'order'
      ? prisma.orderHistory.findMany({
          where: orderQuery,
        })
      : [],
  ])

  const transactions = [
    ...deposit.map((t) => ({ ...t, type: 'add' })),
    ...withdraw.map((t) => ({ ...t, type: 'remove' })),
    ...swap.map((t) => ({ ...t, type: 'swap' })),
    ...orderHistory.map((t) => ({ ...t, type: 'order' })),
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
})

router.get('/transactions/:event_id', async function handler(req, res) {
  const { event_id } = req.params

  if (!event_id) {
    return res.json({
      status: 400,
      data: [],
    })
  }

  const query = {
    eventId: event_id as string,
  }

  const [deposit, withdraw, swap, orderHistory] = await Promise.all([
    prisma.deposit.findMany({ where: query }),
    prisma.withdraw.findMany({ where: query }),
    prisma.swap.findMany({ where: query }),
    prisma.orderHistory.findMany({
      where: query,
    }),
  ])

  const transactions = [
    ...deposit.map((t) => ({ ...t, type: 'add' })),
    ...withdraw.map((t) => ({ ...t, type: 'remove' })),
    ...swap.map((t) => ({ ...t, type: 'swap' })),
    ...orderHistory.map((t) => ({ ...t, type: 'order' })),
  ]

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
})

export default router
