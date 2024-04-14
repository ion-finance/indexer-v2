import { Router } from 'express'
import prisma from 'src/clients/prisma'
import { getBinPrice, getNormalPriceByPrice } from 'src/utils/binMath'
const router = Router()

router.get('/bins', async function handler(req, res) {
  const { poolAddress } = req.query

  if (!poolAddress) {
    return res.json([])
  }

  const [pool, bins, tokens] = await Promise.all([
    prisma.pool.findFirst({
      where: {
        id: poolAddress as string,
      },
    }),
    prisma.bins.findMany({
      where: {
        poolAddress: poolAddress as string,
      },
    }),
    prisma.token.findMany(),
  ])

  if (!pool) {
    return res.json([])
  }

  const tokenX = tokens.find((token) => token.id === pool.tokenXAddress)
  const tokenY = tokens.find((token) => token.id === pool.tokenYAddress)

  if (!tokenX || !tokenY) {
    return res.json([])
  }

  const data = bins.map((bin) => {
    const priceXY = getBinPrice(pool.binStep, bin.binId)
    const priceYX = 1 / priceXY

    const normalPriceXY = getNormalPriceByPrice(
      priceXY, // normalPriceXY is derived from amountPriceYX
      tokenX.decimals,
      tokenY.decimals,
    )
    const normalPriceYX = 1 / normalPriceXY

    return {
      binId: bin.binId,
      priceXY,
      priceYX,
      normalPriceXY,
      normalPriceYX,
      reserveXRaw: bin.reserveX,
      reserveYRaw: bin.reserveY,
      reserveX: Number(BigInt(bin.reserveX) / BigInt(10 ** tokenX.decimals)),
      reserveY: Number(BigInt(bin.reserveY) / BigInt(10 ** tokenY.decimals)),
    }
  })

  return res.json(data)
})

export default router
