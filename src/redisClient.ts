import dotenv from 'dotenv'
import { compact, map } from 'lodash'
import { createClient, RedisClientType } from 'redis'

import { JettonInfo } from './types/ton-api'
import { ParsedTransaction } from './types/ton-center'
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

export const getDataHash = async <T>(key: string) => {
  const redisClient = getRedisClient()
  if (!redisClient) return {}
  try {
    const allData = await redisClient.hGetAll(key)
    return allData
  } catch (err) {
    error('Redis get error:', err)
    return {}
  }
}

export const saveDataHash = async (key: string, field: string, value: any) => {
  const redisClient = getRedisClient()
  try {
    await redisClient?.hSet(key, field, JSON.stringify(value))
  } catch (err) {
    error('Redis set error:', err)
  }
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

// for whole data, from = 0, to = -1
export const getRouterTxsFromCache = async (from: number, to: number) => {
  const redisClient = getRedisClient()
  if (!redisClient) return []
  try {
    const data = await redisClient.zRange('router-txs', from, to)
    if (!data) {
      return []
    }
    const result = map(data, (tx) => JSON.parse(tx)) as ParsedTransaction[]
    return result
  } catch (err) {
    error('Redis get error:', err)
    return []
  }
}

export const saveRouterTxsToCache = async (txs: ParsedTransaction[]) => {
  const redisClient = getRedisClient()
  const data = await redisClient.zRange('router-txs', 0, -1)
  const parsedTransactions = data.map(
    (tx) => JSON.parse(tx) as ParsedTransaction,
  )
  const lastLtFromCache =
    parsedTransactions[parsedTransactions.length - 1]?.lt || 0
  if (!redisClient) return
  try {
    const multi = redisClient.multi()

    for (let i = 0; i < txs.length; i++) {
      const tx = txs[i]
      if (tx.lt <= lastLtFromCache) {
        continue
      }
      multi.zAdd('router-txs', {
        score: tx.lt,
        value: JSON.stringify(tx),
      })
      if (i % 100 === 0) {
        info('Adding router txs to multi', i)
      }
    }

    await multi.exec()
    info('All router txs saved to cache successfully')
  } catch (err) {
    error('Redis zAdd error:', err)
  }
}

const getPoolTxKey = (
  poolAddress: string,
  messageHash: string,
  isInMessage: boolean,
) => {
  if (isInMessage) {
    return `poolAddress:${poolAddress}::inMessageHash:${messageHash}`
  }
  return `poolAddress:${poolAddress}::outMessageHash:${messageHash}`
}

export const savePoolTxsToCache = async (
  poolAddress: string,
  txs: ParsedTransaction[],
) => {
  const redisClient = getRedisClient()
  const multi = redisClient.multi()

  for (const tx of txs) {
    // cache pool txs with inMessageHash and outMessageHash
    const inMessageHash = tx.inMessage?.msg || ''
    const outMessageHashes =
      compact(tx.outMessages?.map((outMessage) => outMessage.msg)) || []
    const lt = tx.lt

    // for inMessage
    const key = getPoolTxKey(poolAddress, inMessageHash, true)
    multi.addCommand(['HSET', key, lt.toString(), JSON.stringify(tx)])
    // for outMessages
    for (const outMessageHash of outMessageHashes) {
      const key = getPoolTxKey(poolAddress, outMessageHash, false)
      multi.addCommand(['HSET', key, lt.toString(), JSON.stringify(tx)])
    }
  }

  await multi.exec()
}

export const getCachedPoolTxFromPrevHash = async ({
  poolAddress,
  prevHashLt,
  inMessageHash,
}: {
  poolAddress: string
  prevHashLt: number
  inMessageHash?: string
}) => {
  if (!prevHashLt) {
    return null
  }
  if (!inMessageHash) {
    return null
  }
  const key = getPoolTxKey(poolAddress, inMessageHash, true)
  const allTransactions = await getDataHash<ParsedTransaction>(key)

  const minimumLtDiffTransaction = findMinimumLtDiffTransaction(
    allTransactions,
    prevHashLt,
    true,
  )
  return minimumLtDiffTransaction
}

export const getCachedPoolTxFromNextHash = async ({
  poolAddress,
  nextHashLt,
  outMessageHash,
}: {
  poolAddress: string
  nextHashLt: number
  outMessageHash?: string
}) => {
  if (!nextHashLt) {
    return null
  }
  if (!outMessageHash) {
    return null
  }
  const key = getPoolTxKey(poolAddress, outMessageHash, false)
  const allTransactions = await getDataHash<ParsedTransaction>(key)
  const minimumLtDiffTransaction = findMinimumLtDiffTransaction(
    allTransactions,
    nextHashLt,
    false,
  )
  return minimumLtDiffTransaction
}

const getLpAccountTxKey = (lpAccountAddress: string, inMessageHash: string) => {
  return `lpAccountAddress:${lpAccountAddress}::inMessageHash:${inMessageHash}`
}

export const getLpAccountTxFromCache = async (
  lpAccountAddress: string,
  prevHashLt: number,
  inMessageHash?: string,
) => {
  if (!inMessageHash || !prevHashLt) {
    return null
  }
  const key = getLpAccountTxKey(lpAccountAddress, inMessageHash)
  const allTransactions = await getDataHash<ParsedTransaction>(key)
  const minimumLtDiffTransaction = findMinimumLtDiffTransaction(
    allTransactions,
    prevHashLt,
    true,
  )
  return minimumLtDiffTransaction
}

export const saveLpAccountTxsToCache = async (
  lpAccountAddress: string,
  txs: ParsedTransaction[],
) => {
  const redisClient = getRedisClient()
  const multi = redisClient.multi()

  for (const tx of txs) {
    const inMessageHash = tx.inMessage?.msg || ''
    const lt = tx.lt
    const key = getLpAccountTxKey(lpAccountAddress, inMessageHash)
    multi.addCommand(['HSET', key, lt.toString(), JSON.stringify(tx)])
  }

  await multi.exec()
}

const findMinimumLtDiffTransaction = (
  allTransactions: Record<string, string>,
  baseLt: number,
  fromPrev: boolean,
): ParsedTransaction | null => {
  return Object.entries(allTransactions)
    .map(
      ([lt, transactionData]) =>
        JSON.parse(transactionData) as ParsedTransaction,
    )
    .filter((transaction) => {
      return fromPrev ? baseLt < transaction.lt : transaction.lt < baseLt
    })
    .reduce(
      (minTx, currentTx) => {
        if (!minTx || currentTx.lt - baseLt < minTx.lt - baseLt) {
          return currentTx
        }
        return minTx
      },
      null as ParsedTransaction | null,
    )
}
export default getRedisClient
