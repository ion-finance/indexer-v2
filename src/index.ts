import * as Sentry from '@sentry/node'
import dotenv from 'dotenv'
import fs from 'fs'
import { drop } from 'lodash'

import api from 'src/api'
import prisma from 'src/clients/prisma'
import { routerAddress } from 'src/constant/address'

import { updateBaseTokenPrices } from './common/updateTokenPrices'
import { MIN_POOL, PORT, isCLMM, isMainnet } from './constant'
import { fetchTrace } from './fetch'
import seedCLMM from './scripts/seedCLMM'
import fetchEvents from './tasks/fetchEvents'
import handleEvent from './tasks/handleEvent'
import { Trace } from './types/ton-api'
import { toLocaleString } from './utils/date'
import { logError, warn } from './utils/log'
import sleep from './utils/sleep'

dotenv.config()

Sentry.init({
  dsn: process.env.SENTRY_DSN,
})

// !NOTE: use cache as default
const useCache = true

// TODO: this can overflow, use redis
let cachedTrace = {} as { [key: string]: Trace }

const loadCache = async () => {
  if (useCache) {
    const path = isMainnet ? 'cache/events/mainnet' : 'cache/events/testnet'
    const names = fs.readdirSync(path).map((file) => {
      if (file.includes('.json')) {
        return file
      }
    })
    names.forEach((name) => {
      console.log('Read cache file: ', name)
      const data = fs.readFileSync(`${path}/${name}`, 'utf-8')
      const traces = JSON.parse(data)
      cachedTrace = { ...cachedTrace, ...traces }
    })
    console.log(`Loaded ${Object.keys(cachedTrace).length} traces.`)
    return
  }
}

const eventPooling = async () => {
  const { timestamp, lastEventId } = await prisma.indexerState.getLastState()
  const fetchedEvents = await fetchEvents({ routerAddress, timestamp })

  // because we fetch events from last timestamp inclusive,
  // 1 event may be duplicated, remove it.
  const hasDuplicated =
    !!lastEventId && fetchedEvents[0]?.event_id === lastEventId
  const events = drop(fetchedEvents, hasDuplicated ? 1 : 0)

  const totalEventsCount = await prisma.indexerState.getTotalEventsCount()

  if (events.length === 0) {
    await sleep(MIN_POOL)
    return
  }

  console.log(`Try to index ${events.length} events.`)

  let error = false
  let lastIndex = 0
  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const eventId = event.event_id
    try {
      const trace = await (async function () {
        if (useCache) {
          const trace = cachedTrace[eventId]
          if (trace) {
            return trace
          }
        }
        const res = await fetchTrace(eventId)
        return res.data
      })()

      await handleEvent({
        routerAddress,
        eventId,
        traces: trace,
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
      await prisma.indexerState.setLastTimestamp(events[lastIndex].timestamp)
    }
    sleep(MIN_POOL)
    return
  }

  const from = events[0].timestamp
  const to = events[events.length - 1].timestamp
  console.log(`${events.length} events are indexed.`)
  console.log(
    `${toLocaleString(from)} ~ ${toLocaleString(to)} / ${from} ~ ${to}`,
  )

  if (events.length > 0) {
    await prisma.indexerState.setLastState({
      timestamp: to,
      totalEventsCount: totalEventsCount + events.length,
      lastEventId: events[events.length - 1].event_id,
    })
  }
  console.log('Total length of events: ', totalEventsCount + events.length)
}

const main = async () => {
  console.log('Event pooling is started. ')
  await loadCache()
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
  console.log(`Server listening on port ${PORT}`)
})
