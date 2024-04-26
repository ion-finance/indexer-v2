import { Request, Response, Router } from 'express'
import { query } from 'express-validator'

import prisma from 'src/clients/prisma'

const router = Router()

router.get(
  '/tasks/pool-creation',
  query('creator')
    .isString()
    .notEmpty()
    .withMessage('Owner address is required'),
  async (req: Request, res: Response) => {
    const { creator } = req.query as { creator: string }

    if (!creator) {
      return res.json({
        status: 400,
        data: [],
      })
    }
    const pool = await prisma.pool.findFirst({
      where: {
        creator,
      },
    })
    if (!pool) {
      return res.json({ status: 404, data: [] })
    }
    return res.json({
      status: 200,
      data: {
        poolId: pool.id,
        creator: pool.creator,
        createdAt: pool.createdAt,
      },
    })
  },
)

export default router
