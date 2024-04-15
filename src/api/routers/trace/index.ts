import prisma from 'src/clients/prisma'

import router from '../pools'

router.get('/traces/:trace_hash', async function handler(req, res) {
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
})

export default router
