import { SwapSimulateRequest, simulateSwap } from '../../../../src/dex/simulate'
import { Request, Response, NextFunction, Router } from 'express'
import { query, validationResult } from 'express-validator'

const router = Router()

const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg })
  }
  next()
}

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
      units: Number(units),
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
