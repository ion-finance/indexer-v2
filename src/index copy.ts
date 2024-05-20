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
import fetchEvents from './tasks/fetchTransactions'
import handleEvent from './tasks/handleEvent'
import { CachedEvent } from './types/events'
import { AccountEvent } from './types/ton-api'
import { toLocaleString } from './utils/date'
import { info, logError, warn } from './utils/log'
import sleep from './utils/sleep'

dotenv.config()

Sentry.init({
  dsn: process.env.SENTRY_DSN,
})

let cacheUsed = false
const eventPooling = async () => {
  const { timestamp, lastEventId } = await prisma.indexerState.getLastState()
  const totalEventsCount = await prisma.indexerState.getTotalEventsCount()
  const loadCachedEvents = async () => {
    if (cacheUsed) {
      return []
    }
    // get last event id from redis
    const cachedEvents = await getEventSummary(0, -1)
    return cachedEvents
  }

  const handleEvents = async (events: CachedEvent[] | AccountEvent[]) => {
    if (events.length === 0) {
      await sleep(MIN_POOL)
      return
    }
    info(`Try to index ${events.length} events.`)

    let error = false
    let lastIndex = 0
    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      const eventId = event.event_id
      try {
        const { trace, cached } = await (async function () {
          // TODO: fetch all the traces of the cache by one request
          const trace = await getTrace(eventId)
          if (trace) {
            return { trace, cached: true }
          }
          const res = await fetchTrace(eventId)
          return { trace: res.data, cached: false }
        })()

        await handleEvent({
          routerAddress,
          eventId,
          trace,
          cached,
        })
      } catch (e) {
        error = true
        warn(`Error when handling event ${eventId}`)
        logError(e)

        lastIndex = i
        // Sentry.captureException(e);
        break
      }
    }

    if (error) {
      if (lastIndex <= events.length - 1) {
        await prisma.indexerState.setLastToLt(events[lastIndex].timestamp)
      }
      sleep(MIN_POOL)
      return
    }

    const from = events[0].timestamp
    const to = events[events.length - 1].timestamp
    info(`${events.length} events are indexed.`)
    info(`${toLocaleString(from)} ~ ${toLocaleString(to)} / ${from} ~ ${to}`)

    if (events.length > 0) {
      await prisma.indexerState.setLastState({
        timestamp: to,
        totalEventsCount: totalEventsCount + events.length,
        lastEventId: events[events.length - 1].event_id,
      })
    }
    info('Total length of events: ' + (totalEventsCount + events.length))
  }

  if (!cacheUsed) {
    info('Load cached events.')
    const cachedEvents = await loadCachedEvents()
    info('cachedEvents.length', cachedEvents.length)
    await handleEvents(cachedEvents)
    cacheUsed = true
  } else {
    // because we fetch events from last timestamp inclusive,
    // 1 event may be duplicated, remove it.
    const allEvents = await fetchEvents({ routerAddress, timestamp })

    const hasDuplicated =
      !!lastEventId && allEvents[0]?.event_id === lastEventId
    const events = drop(allEvents, hasDuplicated ? 1 : 0)

    await handleEvents(events)
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
