import { Router } from 'express'
import prisma from '../../../clients/prisma'

const router = Router()
router.get('/operations', async function handler(req, res) {
  const {
    page,
    pageSize,
    since,
    until,
    poolAddress,
    destinationWalletAddress,
  } = req.query

  const numberRegex = /^[0-9]+$/

  const sinceDate = since ? new Date(String(since)) : undefined
  const untilDate = until ? new Date(String(until)) : undefined

  if (sinceDate && isNaN(sinceDate.getTime())) {
    console.warn('Invalid date format for "since":', since)
    return res.status(400).end()
  }

  if (untilDate && isNaN(untilDate.getTime())) {
    console.warn('Invalid date format for "until":', until)
    return res.status(400).end()
  }

  if (page && !numberRegex.test(String(page))) {
    console.warn('Page must be a positive integer')
    return res.status(400).end()
  }

  if (pageSize && !numberRegex.test(String(pageSize))) {
    console.warn('PageSize must be a positive integer')
    return res.status(400).end()
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
})

export default router
