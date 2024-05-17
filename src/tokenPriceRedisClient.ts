import dotenv from 'dotenv'
import { createClient, RedisClientType } from 'redis'

import { roundUpTimestampByMinutes } from './utils/timestamp'

dotenv.config()

let redisClient: RedisClientType | null = null

const REDIS_HOST = process.env.TOKEN_PRICE_REDIS_HOST
const host = (function () {
  if (REDIS_HOST) {
    const host0 = REDIS_HOST.split(':')[0]
    const host1 = REDIS_HOST.split(':')[1]
    return `${host0}:${host1}`
  }
  return ''
})()
console.log('TOKEN_PRICE_REDIS_HOST: ', host)

const getTokenPriceRedisClient = () => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.TOKEN_PRICE_REDIS_HOST,
    })
    redisClient.connect().catch((err) => {
      console.error('TokenPriceRedis Client Error', err)
    })
  }
  return redisClient
}

export const saveData = async (key: string, value: any) => {
  const redisClient = getTokenPriceRedisClient()
  try {
    await redisClient?.set(key, JSON.stringify(value))
  } catch (err) {
    console.error('TokenPriceRedis set error:', err)
  }
}

export const saveMultiData = async (record: Record<string, number>) => {
  const redisClient = getTokenPriceRedisClient()
  try {
    const multi = redisClient?.multi()

    if (multi) {
      Object.entries(record).forEach(([key, value]) => {
        multi.set(key, value)
      })
      const results = await multi.exec()
      const failed = results
        .map((result, index) => (result !== 'OK' ? index : -1))
        .filter((index) => index !== -1)

      console.log('Failed execution: ', failed)
    }
  } catch (err) {
    console.error('TokenPriceRedis multi error:', err)
  } finally {
    redisClient?.quit()
  }
}

export const getData = async (key: string) => {
  const redisClient = getTokenPriceRedisClient()
  if (!redisClient) return null
  try {
    const data = await redisClient.get(key)
    return data ? JSON.parse(data) : null
  } catch (err) {
    console.error('TokenPriceRedis get error:', err)
    return null
  }
}
export const saveMultiTokenPrice = async (record: Record<string, number>) => {
  await saveMultiData(record)
}
export const saveTokenPrice = async (
  token: string,
  timeStamp: number,
  price: number,
) => {
  // milliseconds to seconds
  if (timeStamp.toString().length === 13) {
    timeStamp = timeStamp / 1000
  }
  const key = `${token}:${roundUpTimestampByMinutes(timeStamp)}`
  await saveData(key, price)
}
export const getTokenPrice = async (token: string, timeStamp: number) => {
  // milliseconds to seconds
  if (timeStamp.toString().length === 13) {
    timeStamp = timeStamp / 1000
  }
  const key = `${token}:${roundUpTimestampByMinutes(timeStamp)}`
  return getData(key)
}

export default getTokenPriceRedisClient
