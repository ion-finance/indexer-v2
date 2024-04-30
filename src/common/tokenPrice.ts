import { TokenPrice } from '@prisma/client'

import prisma from 'src/clients/prisma'

const getLatestTokenPrices = async () => {
  const latestTokenPrices = (await prisma.$queryRaw` 
      SELECT DISTINCT ON (id) *
      FROM "TokenPrice"
      ORDER BY id, timestamp DESC;
  `) as TokenPrice[]
  return latestTokenPrices
}

export default getLatestTokenPrices
