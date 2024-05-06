import { Router } from 'express'

import prisma from 'src/clients/prisma'

const router = Router()

router.get('/tokens', async function handler(req, res) {
  const tokens = await prisma.token.findMany()

  return res.json(tokens)
})

export default router
