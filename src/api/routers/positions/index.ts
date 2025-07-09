import BigNumber from 'bignumber.js'
import { Request, Response, Router } from 'express'
import { param } from 'express-validator'
import { compact } from 'lodash'

import prisma from 'src/clients/prisma'
import { validate } from 'src/common/expressValidator'
import getLatestTokenPrices from 'src/common/tokenPrice'
import { isSameAddress, parseRaw } from 'src/utils/address'
import { bFormatUnits } from 'src/utils/bigNumber'

const router = Router()

const operationValidationRules = [
  param('address').isString().withMessage('address must be an string'),
  validate,
]

router.get(
  '/positions/:address',
  operationValidationRules,
  async (req: Request, res: Response) => {
    const parsedAddress = parseRaw(req.params.address)
    if (!parsedAddress) {
      return res.status(400).json({ message: 'Invalid address' })
    }
    // const tokenPrices = await getLatestTokenPrices()

    const [tokens, pools, lpTokenWallets, deposits] = await Promise.all([
      prisma.token.findMany(),
      prisma.pool.findMany(),
      prisma.lpTokenWallet.findMany({
        where: {
          ownerAddress: parsedAddress,
        },
      }),
      prisma.deposit.findMany({
        where: {
          senderAddress: parsedAddress,
        },
      }),
    ])

    const data = lpTokenWallets.map((wallet) => {
      const pool = pools.find((p) => p.id === wallet.poolAddress)
      const tokenX = tokens.find((t) => t.id === pool?.tokenXAddress)
      const tokenY = tokens.find((t) => t.id === pool?.tokenYAddress)

      if (!pool || !tokenX || !tokenY) {
        return null
      }

      const depositsOfPool = deposits.filter((d) => d.poolAddress === pool?.id)
      const xSum = depositsOfPool.reduce(
        (res, cur) => res.plus(cur.amountX),
        BigNumber(0),
      )
      const ySum = depositsOfPool.reduce(
        (res, cur) => res.plus(cur.amountY),
        BigNumber(0),
      )

      // const lpBalance = (function () {
      //   if (pool?.type === PoolType.CPMM) {
      //     return Number(wallet.amount)
      //   }
      //   const shares = wallet.shares as { amount: string }[]
      //   return shares.reduce((res, cur) => {
      //     return (
      //       res + (tokenY ? Number(formatUnits(cur.amount, tokenY.decimals)) : 0)
      //     )
      //   }, 0)
      // })()
      const lpBalance = wallet.amount ? BigNumber(wallet.amount) : BigNumber(0)

      const lpWalletsOfPool = lpTokenWallets.filter(
        (lp) => lp.poolAddress === pool?.id,
      )
      const totalLpAmount = lpWalletsOfPool.reduce(
        (res, cur) => res.plus(cur.amount),
        BigNumber(0),
      )

      // total usd price of pool reserve
      const totalUsdValue = BigNumber(1)

      // const balanceUsd = totalUsdValue * (lpBalance / totalLpAmount)
      const balanceUsd = totalUsdValue
        .multipliedBy(lpBalance)
        .div(totalLpAmount)

      // total usd price of pool collected protocol fee
      // // TODO: this is wrong, need to track lp Fee
      // const feeUsd =
      //   priceX *
      //     Number(
      //       formatUnits(BigInt(pool.collectedXProtocolFee), tokenX?.decimals),
      //     ) +
      //   priceY *
      //     Number(
      //       formatUnits(BigInt(pool.collectedYProtocolFee), tokenY?.decimals),
      // )

      return {
        ...wallet,
        balanceUsd: balanceUsd.toString(),
        tokenX: {
          ...tokenX,
          deposited: xSum,
        },
        tokenY: {
          ...tokenY,
          deposited: ySum,
        },
      }
    })

    const positions = compact(data)

    const balanceUsd = positions.reduce(
      (res, cur) => res.plus(cur.balanceUsd),
      BigNumber(0),
    )

    // const apy = 12.2
    // TODO: calculate earnedUsd, accruedFee, apy
    // to calculate apy, we need to write the price of token, when deposit occur.
    return res.json({
      summary: {
        balanceUsd,
        // apy,
        // earnedUsd: positions.reduce((res, cur) => res + cur.feeUsd, 0),
      },
      positions,
    })
  },
)

export default router
