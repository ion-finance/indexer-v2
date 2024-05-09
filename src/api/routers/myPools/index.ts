import BigNumber from 'bignumber.js'
import { Request, Response, Router } from 'express'
import { query } from 'express-validator'
import { filter, map } from 'lodash'

import prisma from 'src/clients/prisma'
import { validate } from 'src/common/expressValidator'

const router = Router()

const operationValidationRules = [
  query('ownerAddress')
    .isString()
    .withMessage('Owner address must be a string.'),
  validate,
]

router.get(
  '/my-pools',
  operationValidationRules,
  async (req: Request, res: Response) => {
    const { ownerAddress } = req.query
    if (!ownerAddress) {
      return res.status(400).json({ error: 'Empty ownerAddress' })
    }
    const lpTokenWallets = await prisma.lpTokenWallet.findMany({
      where: {
        ownerAddress: ownerAddress as string,
      },
    })
    const poolAddresses = map(
      filter(lpTokenWallets, (lpTokenWallet) =>
        BigNumber(lpTokenWallet.amount).gt(0),
      ),
      (lpTokenWallet) => lpTokenWallet.poolAddress,
    )
    const pools = await prisma.pool.findMany({
      where: {
        id: {
          in: poolAddresses,
        },
      },
    })
    return res.json(pools)
  },
)

export default router
