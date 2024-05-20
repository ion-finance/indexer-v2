import dotenv from 'dotenv'

import { routerAddress } from 'src/constant/address'
import { fetchTrace } from 'src/fetch'
import getRedisClient, {
  getTxsSummary,
  saveTrace,
  saveTxsSummary,
} from 'src/redisClient'
import fetchTransactions from 'src/tasks/fetchTransactions'
import { TransactionWithHash } from 'src/types/ton-center'
import { warn } from 'src/utils/log'

// TODO: implement append cache
dotenv.config()

let totalCount = 0

// TODO: rename this file as 'generateTxAndTraceCache.ts'
const generate = async () => {
  const transactions = await fetchTransactions({ routerAddress })
  totalCount += transactions.length
  console.log(`${transactions.length} transactions found.`)

  let errorCount = 0
  const run = async (originTxs: TransactionWithHash[]) => {
    const txs = [...originTxs]
    let i = 1
    while (txs.length > 0) {
      const tx = txs.shift()
      if (!tx) {
        return { error: false, txsLeft: null }
      }
      const { hash, hashHex, lt } = tx
      console.log(`${i++}. hashHex: ${hashHex}, hash: ${hash}, lt: ${lt}`)
      try {
        const res = await fetchTrace(hashHex)
        const trace = res.data
        await saveTrace(hashHex, trace)
        const summary = {
          hash,
          hashHex,
          lt: Number(tx.lt),
        }
        await saveTxsSummary(summary)
      } catch (e) {
        if (errorCount > 5) {
          continue // skip this tx
        }
        txs.unshift(tx)
        i--
        errorCount++
        warn(`Error when handling tx, hash:${hash}, hashHex: ${hashHex}`)
      }
    }
    return { error: false, txsLeft: null }
  }

  await run(transactions)

  console.log(`${transactions.length} transactions are indexed.`)
  const from = transactions[0].lt
  const to = transactions[transactions.length - 1].lt

  console.log(`${from} ~ ${to}`)

  console.log('totalCount length: ', totalCount)
}

generate().then(async () => {
  const redisClient = getRedisClient()
  if (!redisClient) {
    console.error('Empty redis client')
    return null
  }
  const transactions = await getTxsSummary(0, -1)
  console.log('transactions', transactions)

  const keys = await redisClient.keys('*')
  console.log('keys', keys)
  redisClient.quit()
  console.log('Redis Client Quit.')
})
