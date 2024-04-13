import { SwapSimulateRequest, simulateSwap } from '../../../../src/dex/simulate'
import { Request, Response, NextFunction, Router } from 'express'
import { query, validationResult } from 'express-validator'

const router = Router()

router.get('/simulate/swap', async function handler(req, res) {
  const {
    offerAddress,
    askAddress,
    units,
    slippageTolerance,
    referralAddress,
  } = req.query
  // TODO: validate
  const swapData = {
    offerAddress,
    askAddress,
    units,
    slippageTolerance,
    referralAddress,
  } as any
  const data = await simulateSwap(swapData)
  return res.json({
    data,
  })
})

export default router
