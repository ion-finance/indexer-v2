import fs from 'fs'

import { saveMultiTokenPrice } from '../tokenPriceRedisClient'
import { roundUpTimestampByMinutes } from '../utils/timestamp'

const generate = async () => {
  const env = 'mainnet'
  const priceFolderPath = `./cache/events/${env}/price/`

  const files = await fs.promises.readdir(priceFolderPath)

  const prices: any = {}

  for (const file of files) {
    const data = await fs.promises.readFile(priceFolderPath + file, 'utf8')

    const jsonData = JSON.parse(data)

    for (const utime of Object.keys(jsonData)) {
      prices[utime] = jsonData[utime]
    }
  }

  const record: any = {}

  if (prices) {
    for (const utime of Object.keys(prices)) {
      const tonKey = `ton:${roundUpTimestampByMinutes(parseInt(utime))}`
      const usdtKey = `usdt:${roundUpTimestampByMinutes(parseInt(utime))}`

      record[tonKey] = prices[utime].TON
      record[usdtKey] = prices[utime].USDT
    }
  }

  if (Object.keys(record).length > 0) {
    await saveMultiTokenPrice(record)
  }
}

;(async () => {
  await generate()
})()
