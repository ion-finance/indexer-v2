import dotenv from 'dotenv'
import { createClient, RedisClientType } from 'redis'

import { CachedEvent } from './types/events'
import { JettonInfo, Trace } from './types/ton-api'

dotenv.config()

let redisClient: RedisClientType | null = null

const REDIS_HOST = process.env.REDIS_HOST
const host = (function () {
  if (REDIS_HOST) {
    const host0 = REDIS_HOST.split(':')[0]
    const host1 = REDIS_HOST.split(':')[1]
    return `${host0}:${host1}`
  }
  return ''
})()
console.log('REDIS_HOST: ', host)

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_HOST,
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
    await redisClient?.set(key, JSON.stringify(value))
  } catch (err) {
    console.error('Redis set error:', err)
  }
}

export const getData = async <T>(key: string) => {
  const redisClient = getRedisClient()
  if (!redisClient) return null
  try {
    const data = await redisClient.get(key)
    return data ? (JSON.parse(data) as T) : null
  } catch (err) {
    console.error('Redis get error:', err)
    return null
  }
}

export const saveTrace = async (eventId: string, trace: Trace) => {
  const key = `trace:${eventId}`
  await saveData(key, trace)
}
export const getTrace = async (eventId: string) => {
  const key = `trace:${eventId}`
  return getData<Trace>(key)
}

export const saveEventSummary = async (event: CachedEvent) => {
  const redisClient = getRedisClient()
  if (!redisClient) return
  try {
    await redisClient.zAdd('eventIds', {
      score: event.lt,
      value: JSON.stringify(event),
    })
  } catch (err) {
    console.error('Redis zAdd error:', err)
  }
}

// for whole data, from = 0, to = -1
export const getEventSummary = async (from: number, to: number) => {
  const redisClient = getRedisClient()
  if (!redisClient) return []
  try {
    const data = await redisClient.zRange('eventIds', from, to)
    if (!data) {
      return []
    }
    const result = data.map((summary) => JSON.parse(summary) as CachedEvent)
    return result
  } catch (err) {
    console.error('Redis get error:', err)
    return []
  }
}

export default getRedisClient
