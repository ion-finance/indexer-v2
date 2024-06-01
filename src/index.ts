import * as Sentry from '@sentry/node'
import dotenv from 'dotenv'
import { filter, map } from 'lodash'

import api from 'src/api'
import prisma from 'src/clients/prisma'
import { routerAddress } from 'src/constant/address'

import { updateBaseTokenPrices } from './common/updateTokenPrices'
import { MIN_POOL, PORT, isCLMM } from './constant'
import seedCLMM from './scripts/seedCLMM'
import fetchTransactions from './tasks/fetchTransactions'
import handleRouterTransaction from './tasks/handleRouterTransaction'
import { loadCachedRouterTxs, parseTransaction } from './transactions'
import { ParsedTransaction } from './types/ton-center'
import { info, warn } from './utils/log'
import sleep from './utils/sleep'

dotenv.config()

Sentry.init({
  dsn: process.env.SENTRY_DSN,
})

let cacheUsed = false

const handleRouterTxs = async ({
  txs,
  toLt,
  totalTransactionsCount,
}: {
  txs: ParsedTransaction[]
  toLt?: string
  totalTransactionsCount: number
}) => {
  let txsCount = totalTransactionsCount
  if (txs.length === 0) {
    await sleep(MIN_POOL)
    return
  }
  info(`Try to index ${txs.length} txs.`)

  const run = async (originTxs: ParsedTransaction[]) => {
    const routerTxs = [...originTxs]
    while (routerTxs.length > 0) {
      const routerTx = routerTxs.shift()
      if (!routerTx) {
        return { error: false, txsLeft: [] }
      }
      // TODO: try catch here?
      const success = await handleRouterTransaction({
        routerTxs,
        routerTx,
        txsCount: txsCount + 1,
        toLt,
      })
      if (success) {
        txsCount += 1
      }
    }
    return { error: false, txsLeft: [] }
  }
  const { error, txsLeft } = await run(txs)

  // error case
  if (error) {
    if (!txsLeft || txsLeft.length === 0) {
      warn('TxsLeft is empty, this should not be happened.')
      return
    }
    // minus 1, toLt is exclusive
    // const toLt = (Number(txsLeft[0].lt) - 1).toString()
    // info('set toLt', toLt)
    // await prisma.indexerState.setLastState({
    //   toLt,
    //   totalTransactionsCount: txsCount,
    // })
    sleep(MIN_POOL)
    return
  }

  // success case
  const from = txs[0].lt.toString()
  const to = txs[txs.length - 1].lt.toString()
  const indexedTxs = txs.length - (txsLeft?.length || 0)
  info(`${indexedTxs} txs are indexed.`)
  info(`${from} ~ ${to}`)

  if (txs.length > 0) {
    info(`Set lastState, toLt: ${to}`)
    await prisma.indexerState.setLastState({
      toLt: to,
      totalTransactionsCount: txsCount,
    })
  }
  info('Total length of txs: ' + txsCount)
}

const transactionPooling = async () => {
  const { toLt, totalTransactionsCount } =
    await prisma.indexerState.getLastState()
  if (!cacheUsed) {
    info('Load cached txs.')
    const allCachedTxs = await loadCachedRouterTxs()
    const cachedTxs = toLt
      ? filter(allCachedTxs, (tx) => Number(toLt) < Number(tx.lt))
      : allCachedTxs

    info('cachedTxs.length', cachedTxs.length)
    await handleRouterTxs({ txs: cachedTxs, toLt, totalTransactionsCount })
    cacheUsed = true
  } else {
    const txs = await fetchTransactions({
      contractAddress: routerAddress,
      toLt,
    })
    const parsedTxs = map(txs, (tx) => parseTransaction(tx))
    await handleRouterTxs({ txs: parsedTxs, toLt, totalTransactionsCount })
  }
}

const main = async () => {
  info('Tx pooling is started. ')
  await updateBaseTokenPrices()
  if (isCLMM) {
    await seedCLMM()
  } else {
    for (;;) {
      await transactionPooling()
    }
  }
}

main()

api.listen(PORT, () => {
  info(`Server listening on port ${PORT}`)
})
