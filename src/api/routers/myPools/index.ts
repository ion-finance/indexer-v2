import BigNumber from 'bignumber.js'
import { Request, Response, Router } from 'express'
import { query } from 'express-validator'
import { filter, map } from 'lodash'

import prisma from 'src/clients/prisma'

const router = Router()

router.get(
  '/my-pools',
  query('ownerAddress')
    .isString()
    .withMessage('Owner address must be a string.'),
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
    console.log('poolAddresses', poolAddresses)
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
