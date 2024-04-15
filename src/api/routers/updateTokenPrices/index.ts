import updateTokenPricesLogic from './updateTokenPricesLogic'
import router from '../pools'

router.get('/update-token-prices', async function handler(req, res) {
  await updateTokenPricesLogic()
  return res.status(200).json(true)
})

export default router
