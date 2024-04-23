import { TokenPrice } from '@prisma/client'
import { Router } from 'express'

import prisma from 'src/clients/prisma'

const router = Router()

router.get('/token-prices-history', async function handler(req, res) {
  const tokenPrices = (await prisma.tokenPrice.findMany()) as TokenPrice[]
  return res.json(tokenPrices)
})

export default router
