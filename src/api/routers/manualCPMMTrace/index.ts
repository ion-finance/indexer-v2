import handleEvent from '../../../tasks/handleEvent'
import router from '../pools'

// This api is only available in development mode
// Run trace handler one time for a specific trace hash
router.get('/manual-cpmm-trace/:trace_hash', async function handler(req, res) {
  const isDev = process.env.IS_DEV === 'true'
  if (!isDev) {
    console.warn('This endpoint is only available in development mode')
    return
  }
  const { trace_hash } = req.params
  await handleEvent(trace_hash)
  return res.status(200).json(true)
})

export default router
