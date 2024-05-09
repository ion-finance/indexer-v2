import { NextFunction, Response } from 'express'
import { validationResult } from 'express-validator'
import { Request } from 'express-validator/src/base'

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg })
  }
  next()
}
