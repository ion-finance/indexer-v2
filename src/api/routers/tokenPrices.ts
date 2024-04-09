import router from './pools'
import prisma from '../../clients/prisma'
import { TokenPrice } from '@prisma/client'

router.get('/token-prices', async function handler(req, res) {
  const tokenPrices = (await prisma.tokenPrice.findMany()) as TokenPrice[]
  return res.json(tokenPrices)
})

export default router
