import dotenv from 'dotenv'
import { createClient, RedisClientType } from 'redis'

dotenv.config()

let redisClient: RedisClientType | null = null

console.log('REDIS_HOST: ', process.env.REDIS_HOST)
const getRedisClient = () => {
  if (!redisClient) {
    redisClient = createClient({
      url: `redis://${process.env.REDIS_HOST}:6379`,
    })
    redisClient.connect().catch((err) => {
      console.error('Redis Client Error', err)
    })
  }
  return redisClient
}

export const saveData = async (key: string, value: any) => {
  const redisClient = getRedisClient()
  try {
    await redisClient.set(key, JSON.stringify(value))
    console.log('Data saved to Redis')
  } catch (err) {
    console.error('Redis set error:', err)
  }
}

export const getData = async (key: string) => {
  const redisClient = getRedisClient()
  try {
    const data = await redisClient.get(key)
    return data ? JSON.parse(data) : null
  } catch (err) {
    console.error('Redis get error:', err)
  }
}

export default getRedisClient
