import { Router } from 'express'
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

export default router
