import { raw } from '@prisma/client/runtime/library'
import * as Sentry from '@sentry/node'
import dotenv from 'dotenv'
import { drop } from 'lodash'

import api from 'src/api'
import prisma from 'src/clients/prisma'
import { routerAddress } from 'src/constant/address'

import { updateBaseTokenPrices } from './common/updateTokenPrices'
import { MIN_POOL, PORT, isCLMM } from './constant'
import { fetchTrace } from './fetch'
import { getEventSummary, getTrace } from './redisClient'
import seedCLMM from './scripts/seedCLMM'
import fetchTransactions from './tasks/fetchTransactions'
import handleEvent from './tasks/handleEvent'
import { CachedEvent } from './types/events'
import { AccountEvent } from './types/ton-api'
import { TransactionWithHash } from './types/ton-center'
import { toLocaleString } from './utils/date'
import { info, logError, warn } from './utils/log'
import sleep from './utils/sleep'

dotenv.config()

Sentry.init({
  dsn: process.env.SENTRY_DSN,
})

// const cacheUsed = false
const cacheUsed = true

const eventPooling = async () => {
  const { toLt, totalEventsCount } = await prisma.indexerState.getLastState()

  const loadCachedEvents = async () => {
    if (cacheUsed) {
      return []
    }
    // get last event id from redis
    const cachedEvents = await getEventSummary(0, -1)
    return cachedEvents
  }

  const handleTxs = async (txs: TransactionWithHash[]) => {
    if (txs.length === 0) {
      await sleep(MIN_POOL)
      return
    }
    info(`Try to index ${txs.length} txs.`)

    let errorCount = 0
    const run = async (originTxs: TransactionWithHash[]) => {
      const txs = [...originTxs]
      while (txs.length > 0) {
        const tx = txs.shift()
        if (!tx) {
          return { error: false, txsLeft: null }
        }
        const { hash, hashHex } = tx
        try {
          const { trace, cached, eventId } = await (async function () {
            // TODO: fetch all the traces of the cache by one request
            // const trace = await getTrace(eventId)
            // if (trace) {
            //   return { trace, cached: true }
            // }
            const res = await fetchTrace(hashHex)
            const eventId = res.data.transaction.hash
            return { trace: res.data, cached: false, eventId }
          })()

          await handleEvent({
            routerAddress,
            eventId,
            trace,
            cached,
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
      const toLt = (txsLeft[0].lt - 1n).toString()
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
    // info('Load cached events.')
    // const cachedEvents = await loadCachedEvents()
    // info('cachedEvents.length', cachedEvents.length)
    // await handleTxs(cachedEvents)
    // cacheUsed = true
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
