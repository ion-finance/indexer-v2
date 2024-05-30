import dotenv from 'dotenv'

import { routerAddress } from 'src/constant/address'
import getRedisClient, {
  saveRouterTxsToCache,
  getRouterTxsFromCache,
} from 'src/redisClient'
import fetchTransactions from 'src/tasks/fetchTransactions'
import { parseTransaction } from 'src/transactions'

dotenv.config()

const generate = async () => {
  const txs = await fetchTransactions({
    contractAddress: routerAddress,
  })
  const parsedTxs = txs.map((tx) => parseTransaction(tx))
  console.log('parsedTxs', parsedTxs.length)
  await saveRouterTxsToCache(parsedTxs)
}

generate().then(async () => {
  const redisClient = getRedisClient()
  if (!redisClient) {
    console.error('Empty redis client')
    return null
  }
  const transactions = await getRouterTxsFromCache(0, -1)
  // console.log('transactions', transactions)

  const keys = await redisClient.keys('*')
  console.log('keys', keys)
  redisClient.quit()
  console.log('Redis Client Quit.')
})
