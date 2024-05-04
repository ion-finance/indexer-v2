import * as Sentry from '@sentry/node'
import axios from 'axios'
import dotenv from 'dotenv'
import fs from 'fs'
import { filter } from 'lodash'

import api from 'src/api'
import prisma from 'src/clients/prisma'
import { routerAddress } from 'src/constant/address'

import { updateBaseTokenPrices } from './common/updateTokenPrices'
import seedCLMM from './scripts/seedCLMM'
import fetchEvents from './tasks/fetchEvents'
import handleEvent from './tasks/handleEvent'
// import handleEventCLMM from './tasks/handleEventCLMM'
import { Trace } from './types/ton-api'
import { toLocaleString } from './utils/date'
import sleep from './utils/sleep'
import { getInput } from './utils/userInput'

dotenv.config()

const PORT = process.env.PORT || 3000
const MIN_POOL = 2000 // 2s

Sentry.init({
  dsn: process.env.SENTRY_DSN,
})

const isCLMM = process.env.IS_CLMM === 'true'
const useCache = process.env.USE_CACHE === 'true'

let cachedTrace = {} as { [key: string]: Trace }

const checkCache = async () => {
  if (useCache) {
    const value = await getInput('Type cache file name to use:')
    const names = fs.readdirSync('cache/events').map((file) => {
      if (file.includes('.json')) {
        return file
      }
    })
    console.log(names)
    const files = filter(names, (name) => name?.includes(value))
    if (!files?.length) {
      console.log('No file found')
      return
    }
    const file = files[files.length - 1]
    console.log('file', file)
    const data = fs.readFileSync(`cache/events/${file}`, 'utf-8')
    cachedTrace = JSON.parse(data)
    return
  }
}

let totalEvents = 0
const eventPooling = async () => {
  const timestamp = await prisma.indexerState.getLastTimestamp()
  const events = await fetchEvents({ routerAddress, timestamp })
  totalEvents += events.length

  if (events.length === 0) {
    // console.debug(`No events found. Sleep for ${MIN_POOL / 1000}s.`);
    sleep(MIN_POOL)
    return
  }

  console.log(`${events.length} events found.`)
  let error = false
  let lastIndex = 0
  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const eventId = event.event_id
    try {
      const trace = await (async function () {
        if (useCache) {
          return cachedTrace[eventId]
        }
        const res = await axios(
          `${process.env.TON_API_URL}/traces/${eventId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.TON_API_KEY}`,
            },
          },
        )
        return res.data as Trace
      })()

      await handleEvent({
        routerAddress,
        eventId,
        traces: trace,
      })
    } catch (e) {
      error = true
      console.error(`Error when handling event ${eventId}`)
      if (axios.isAxiosError(e)) {
        e.config?.url && console.error('url: ', e.config.url)
        e.response && console.error('data: ', e.response.data)
        e.response?.status && console.error('status: ', e.response.status)
        e.response?.statusText &&
          console.error('statusText: ', e.response.statusText)
        console.error('API_KEY', process.env.TON_API_KEY)
      } else {
        console.error(e)
      }
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

  console.log(`${events.length} events are indexed.`)
  console.log('totalEvents length: ', totalEvents)
  console.log(
    `from ${toLocaleString(events[0].timestamp)} to ${toLocaleString(events[events.length - 1].timestamp)}`,
  )

  if (events.length > 0) {
    await prisma.indexerState.setLastTimestamp(
      events[events.length - 1].timestamp,
    )
  }
}

const main = async () => {
  console.log('Event pooling is started. ')
  await checkCache()
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
