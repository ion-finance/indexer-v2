import { TonClient } from '@ton/ton'

const ton = new TonClient({
  endpoint: process.env.TON_CENTER_API_URL || '',
  apiKey: process.env.TON_CENTER_API_KEY || '',
})

export default ton
