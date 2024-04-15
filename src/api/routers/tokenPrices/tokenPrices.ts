import { TokenPrice } from '@prisma/client'

import prisma from 'src/clients/prisma'

import router from '../pools'

router.get('/token-prices', async function handler(req, res) {
  const tokenPrices = (await prisma.tokenPrice.findMany()) as TokenPrice[]
  return res.json(tokenPrices)
})

export default router
