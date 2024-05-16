import axios from 'axios'

import { Trace } from 'src/types/ton-api'

import handleEvent from '../../../tasks/handleEvent'
import router from '../pools'

// This api is only available in development mode
// Run trace handler one time for a specific trace hash
router.get(
  '/manual-cpmm-event/:event_id',
  async function handler(request, response) {
    const isDev = process.env.IS_DEV === 'true'
    if (!isDev) {
      console.warn('This endpoint is only available in development mode')
      return
    }
    const { event_id } = request.params
    const eventId = event_id
    const res = await axios(`${process.env.TON_API_URL}/traces/${eventId}`, {
      headers: {
        Authorization: `Bearer ${process.env.TON_API_KEY}`,
      },
    })

    await handleEvent({
      routerAddress: process.env.ROUTER_ADDRESS || '',
      eventId,
      trace: res.data as Trace,
    })
    return response.status(200).json(true)
  },
)

export default router
