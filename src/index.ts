import dotenv from 'dotenv'
import fetchEvents from './tasks/fetchEvents'
import handleEvent from './tasks/handleEvent'
import handleEventCLMM from './tasks/handleEventCLMM'
import prisma from './clients/prisma'
import sleep from './utils/sleep'
import api from './api'
import * as Sentry from '@sentry/node'
import swaggerJSdoc from 'swagger-jsdoc'
import * as swaggerUI from 'swagger-ui-express'

dotenv.config()

const PORT = process.env.PORT || 3000
const MIN_POOL = 2000 // 2s

Sentry.init({
  dsn: process.env.SENTRY_DSN,
})

const isCLMM = process.env.IS_CLMM === 'true'
const eventPooling = async () => {
  const events = await fetchEvents()

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
    try {
      if (isCLMM) {
        await handleEventCLMM(event.event_id)
      } else {
        await handleEvent(event)
      }
    } catch (e) {
      error = true
      console.error(e)
      console.error(`Error when handling event ${events[i].event_id}`)
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

  if (events.length > 0) {
    await prisma.indexerState.setLastTimestamp(
      events[events.length - 1].timestamp,
    )
  }
}

const main = async () => {
  console.log('Event pooling is started. ')
  for (;;) {
    await eventPooling()
  }
}

main()

api.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
