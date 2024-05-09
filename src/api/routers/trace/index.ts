import { Request, Response } from 'express'
import { param } from 'express-validator'

import prisma from 'src/clients/prisma'
import { validate } from 'src/common/expressValidator'

import router from '../pools'

const operationValidationRules = [
  param('trace_hash')
    .optional()
    .isString()
    .withMessage('trace_hash must be an string'),
  validate,
]

router.get(
  '/traces/:trace_hash',
  operationValidationRules,

  async (req: Request, res: Response) => {
    const { trace_hash } = req.params

    const deposit = await prisma.deposit.findFirst({
      where: { id: trace_hash },
    })
    const swap = await prisma.swap.findFirst({
      where: { id: trace_hash },
    })

    const withdraw = await prisma.withdraw.findFirst({
      where: { id: trace_hash },
    })
    const hasTrace = deposit || swap || withdraw
    return res.json(hasTrace)
  },
)

export default router
