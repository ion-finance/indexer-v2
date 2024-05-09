import BigNumber from 'bignumber.js'
import { Request, Response, Router } from 'express'
import { query } from 'express-validator'

import { validate } from 'src/common/expressValidator'
import { simulateSwap } from 'src/dex/simulate/swap'
import { SwapSimulateRequest } from 'src/dex/simulate/type'

const router = Router()

const swapValidationRules = [
  query('offerAddress')
    .isString()
    .withMessage('Offer address must be a valid string.'),
  query('askAddress')
    .isString()
    .withMessage('Ask address must be a valid string.'),
  query('units')
    .isNumeric()
    .toInt()
    .isInt({ gt: 0 })
    .withMessage('Units must be a positive integer.'),
  query('slippageTolerance')
    .isFloat({ gt: 0, lt: 1 })
    .withMessage('Slippage tolerance must be a positive number less than 1.'),
  query('referralAddress')
    .optional()
    .isString()
    .withMessage('Referral address must be a valid string if provided.'),
  validate,
]

router.get(
  '/simulate-swap',
  swapValidationRules,
  async (req: Request, res: Response) => {
    const {
      offerAddress,
      askAddress,
      units,
      slippageTolerance,
      referralAddress,
    } = req.query as {
      offerAddress: string
      askAddress: string
      units: string
      slippageTolerance: string
      referralAddress?: string
    }

    const swapData = {
      offerAddress,
      askAddress,
      units: BigNumber(units),
      slippageTolerance: Number(slippageTolerance),
      referralAddress,
    } as SwapSimulateRequest

    try {
      const data = await simulateSwap(swapData)
      res.json({ data })
    } catch (error) {
      console.error('Error in simulateSwap:', error)
      res.status(500).send('Internal Server Error')
    }
  },
)

export default router
