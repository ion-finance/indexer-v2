import updateQuoteTokenPrices from 'src/common/updateTokenPrices'

import router from '../pools'

router.get('/update-token-prices', async function handler(req, res) {
  await updateQuoteTokenPrices()
  return res.status(200).json(true)
})

export default router
