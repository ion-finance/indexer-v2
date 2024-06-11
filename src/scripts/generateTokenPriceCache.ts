import fs from 'fs'

import { saveMultiTokenPrice } from '../tokenPriceRedisClient'

const generate = async () => {
  const env = 'mainnet'
  const staticPrice = `./cache/events/mainnet/price/staticTokenPrice.json`

  const data = await fs.promises.readFile(staticPrice, 'utf8')

  const jsonData = JSON.parse(data)

  if (Object.keys(jsonData).length > 0) {
    await saveMultiTokenPrice(jsonData)
  }
}

;(async () => {
  await generate()
})()
