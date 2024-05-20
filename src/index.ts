import * as Sentry from '@sentry/node'
import dotenv from 'dotenv'

import api from 'src/api'
import prisma from 'src/clients/prisma'
import { routerAddress } from 'src/constant/address'

import { updateBaseTokenPrices } from './common/updateTokenPrices'
import { MIN_POOL, PORT, isCLMM } from './constant'
import { fetchTrace } from './fetch'
import { getTxsSummary, getTrace } from './redisClient'
import seedCLMM from './scripts/seedCLMM'
import fetchTransactions from './tasks/fetchTransactions'
import handleEvent from './tasks/handleEvent'
import { TransactionWithHash, TxCache } from './types/ton-center'
import { info, logError, warn } from './utils/log'
import sleep from './utils/sleep'

dotenv.config()

Sentry.init({
  dsn: process.env.SENTRY_DSN,
})

let cacheUsed = false

const eventPooling = async () => {
  const { toLt, totalEventsCount } = await prisma.indexerState.getLastState()

  const loadCachedTxs = async () => {
    if (cacheUsed) {
      return []
    }
    const cached = await getTxsSummary(0, -1)
    return cached
  }

  const handleTxs = async (txs: TransactionWithHash[] | TxCache[]) => {
    if (txs.length === 0) {
      await sleep(MIN_POOL)
      return
    }
    info(`Try to index ${txs.length} txs.`)

    let errorCount = 0
    const run = async (originTxs: TransactionWithHash[] | TxCache[]) => {
      const txs = [...originTxs]
      while (txs.length > 0) {
        const tx = txs.shift()
        if (!tx) {
          return { error: false, txsLeft: null }
        }
        const { hash, hashHex } = tx
        try {
          const res = await (async function () {
            // TODO: fetch all the traces of the cache by one request
            const trace = await getTrace(hashHex)
            if (trace) {
              return { trace, cached: true, hashHex }
            }
            const res = await fetchTrace(hashHex)
            return { trace: res.data, cached: false, hashHex }
          })()
          const eventId = res.trace.transaction.hash

          await handleEvent({
            routerAddress,
            // eventId: res.hashHex,
            eventId,
            trace: res.trace,
            cached: res.cached,
          })
          errorCount = 0
        } catch (e) {
          txs.unshift(tx)
          // if error occurs for 5 times for same tx, fetch transactions again
          if (errorCount > 5) {
            return { error: true, txsLeft: txs }
          }
          errorCount += 1
          warn(`Error when handling tx, hash:${hash}, hashHex: ${hashHex}`)
          logError(e)

          // Sentry.captureException(e);
        }
      }
      return { error: false, txsLeft: null }
    }

    const { error, txsLeft } = await run(txs)

    // error case
    if (error) {
      if (!txsLeft || txsLeft.length === 0) {
        warn('TxsLeft is empty, this should not be happened.')
        return
      }
      // minus 1, toLt is exclusive
      const toLt = (Number(txsLeft[0].lt) - 1).toString()
      console.log('set toLt', toLt)
      await prisma.indexerState.setLastState({
        toLt,
        totalEventsCount,
      })
      sleep(MIN_POOL)
      return
    }

    // success case
    const from = txs[0].lt.toString()
    const to = txs[txs.length - 1].lt.toString()
    info(`${txs.length} txs are indexed.`)
    info(`${from} ~ ${to}`)

    if (txs.length > 0) {
      info(`Set lastState, toLt: ${to}`)
      await prisma.indexerState.setLastState({
        toLt: to,
        totalEventsCount: totalEventsCount + txs.length,
      })
    }
    info('Total length of events: ' + (totalEventsCount + txs.length))
  }

  if (!cacheUsed) {
    info('Load cached events.')
    const cachedTxs = await loadCachedTxs()
    info('cachedTxs.length', cachedTxs.length)
    await handleTxs(cachedTxs)
    cacheUsed = true
  } else {
    const txs = await fetchTransactions({ routerAddress, toLt })
    await handleTxs(txs)
  }
}

const main = async () => {
  info('Event pooling is started. ')
  await updateBaseTokenPrices()
  if (isCLMM) {
    await seedCLMM()
  } else {
    for (;;) {
      await eventPooling()
    }
  }
}

main()

api.listen(PORT, () => {
  info(`Server listening on port ${PORT}`)
})
