import dotenv from 'dotenv'
import { createClient, RedisClientType } from 'redis'

import { CachedEvent } from './types/events'
import { JettonInfo, Trace } from './types/ton-api'
import { error, info } from './utils/log'

dotenv.config()

let redisClient: RedisClientType | null = null

const REDIS_HOST = process.env.REDIS_HOST
const host = (function () {
  if (REDIS_HOST) {
    if (REDIS_HOST.includes('localhost')) {
      return 'localhost'
    }
    const host = REDIS_HOST.split('@')[1]
    return host
  }
  return ''
})()
info('REDIS_HOST: ', host)

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_HOST,
    })
    redisClient.connect().catch((err) => {
      error('Redis Client Error', err)
    })
  }
  return redisClient
}

export const saveData = async (key: string, value: any) => {
  const redisClient = getRedisClient()
  try {
    await redisClient?.set(key, JSON.stringify(value))
  } catch (err) {
    error('Redis set error:', err)
  }
}

export const getData = async <T>(key: string) => {
  const redisClient = getRedisClient()
  if (!redisClient) return null
  try {
    const data = await redisClient.get(key)
    return data ? (JSON.parse(data) as T) : null
  } catch (err) {
    error('Redis get error:', err)
    return null
  }
}

export const saveTrace = async (eventId: string, trace: Trace) => {
  const key = `trace:${eventId}`
  await saveData(key, trace)
}
export const getTrace = async (eventId: string) => {
  const key = `trace:${eventId}`
  return await getData<Trace>(key)
}

export const saveTokenData = async (
  walletAddress: string,
  tokenData: JettonInfo & { minter_address: string },
) => {
  const key = `tokenData:${walletAddress}`
  await saveData(key, tokenData)
}

export const getTokenData = async (walletAddress: string) => {
  const key = `tokenData:${walletAddress}`

  const result = await getData<JettonInfo & { minter_address: string }>(key)
  return result
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
    error('Redis zAdd error:', err)
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
    error('Redis get error:', err)
    return []
  }
}

export default getRedisClient
