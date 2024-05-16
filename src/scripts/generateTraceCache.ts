import dotenv from 'dotenv'

import { routerAddress } from 'src/constant/address'
import { fetchTrace } from 'src/fetch'
import getRedisClient, {
  getEventSummary,
  saveEventSummary,
  saveTrace,
} from 'src/redisClient'
import fetchEvents from 'src/tasks/fetchEvents'
import { toLocaleString } from 'src/utils/date'
import { error } from 'src/utils/log'

// TODO: implement append cache
// get the last timestamp of last cache file
// and set timestamp as last cached one
// fetch and make file

dotenv.config()

let totalEvents = 0

const generate = async () => {
  const events = await fetchEvents({ routerAddress, timestamp: 0 })
  totalEvents += events.length
  console.log(`${events.length} events found.`)

  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const eventId = event.event_id

    console.log(`${i + 1}. ${eventId}`)
    try {
      const res = await fetchTrace(eventId)
      const trace = res.data
      await saveTrace(eventId, trace)
      const summary = {
        event_id: eventId,
        timestamp: event.timestamp,
        lt: event.lt,
      }
      await saveEventSummary(summary)
    } catch (e) {
      error(`Error when handling event ${eventId}`)
      return
    }
  }

  console.log(`${events.length} events are indexed.`)
  const from = events[0].timestamp
  const to = events[events.length - 1].timestamp

  console.log(
    `${toLocaleString(from)} ~ ${toLocaleString(to)} / ${from} ~ ${to}`,
  )

  console.log('totalEvents length: ', totalEvents)
}

generate().then(async () => {
  const redisClient = getRedisClient()
  if (!redisClient) {
    console.error('Empty redis client')
    return null
  }
  const events = await getEventSummary(0, -1)
  console.log('events', events)

  const keys = await redisClient.keys('*')
  console.log('keys', keys)
  redisClient.quit()
  console.log('Redis Client Quit.')
})
