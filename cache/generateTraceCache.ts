import axios from 'axios'
import dotenv from 'dotenv'
import fs from 'fs'
import moment from 'moment'

import { routerAddress } from 'src/address'
import fetchEvents from 'src/tasks/fetchEvents'
import { Trace } from 'src/types/ton-api'
import { toLocaleString } from 'src/utils/date'

dotenv.config()
const MAINNET = process.env.MAINNET === 'true'

let totalEvents = 0

const allTrace = [] as { eventId: string; trace: Trace }[]
const generate = async () => {
  const events = await fetchEvents({ routerAddress, timestamp: 0 })
  totalEvents += events.length
  console.log(`${events.length} events found.`)
  for (let i = 0; i < events.length; i++) {
    if (i % 10 === 0) console.log(`Processing ${i} events...`)
    const event = events[i]
    const eventId = event.event_id
    try {
      const trace = (
        await axios(`${process.env.TON_API_URL}/traces/${eventId}`, {
          headers: {
            Authorization: `Bearer ${process.env.TON_API_KEY}`,
          },
        })
      ).data as Trace
      const traceMap = {
        eventId,
        trace,
      }
      allTrace.push(traceMap)
    } catch (e) {
      break
    }
  }

  const allTraceMap = allTrace.reduce(
    (acc, cur) => {
      acc[cur.eventId] = cur.trace
      return acc
    },
    {} as { [key: string]: Trace },
  )
  fs.writeFileSync(
    `cache/events/${moment().format('YYYYMMDD_h:mm:ss')}_${MAINNET ? 'mainnet' : 'testnet'}.json`,
    JSON.stringify(allTraceMap, null, 2),
  )
  console.log(`${events.length} events are indexed.`)
  console.log('totalEvents length: ', totalEvents)
  console.log(
    `from ${toLocaleString(events[0].timestamp)} to ${toLocaleString(events[events.length - 1].timestamp)}`,
  )
}

generate()
