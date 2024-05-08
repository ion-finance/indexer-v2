import dotenv from 'dotenv'
import fs from 'fs'
import { chunk } from 'lodash'

import { isMainnet } from 'src/constant'
import { routerAddress } from 'src/constant/address'
import { fetchTrace } from 'src/fetch'
import fetchEvents from 'src/tasks/fetchEvents'
import { Trace } from 'src/types/ton-api'
import { toLocaleString } from 'src/utils/date'

// TODO: implement append cache
// get the last timestamp of last cache file
// and set timestamp as last cached one
// fetch and make file

dotenv.config()

let totalEvents = 0
const CHUNK_SIZE = 50

const generate = async () => {
  const events = await fetchEvents({ routerAddress, timestamp: 0 })
  totalEvents += events.length
  console.log(`${events.length} events found.`)
  const eventChunks = chunk(events, CHUNK_SIZE)

  let fileCount = 0

  for (let index = 0; index < eventChunks.length; index++) {
    const events = eventChunks[index]
    if (events.length !== CHUNK_SIZE) {
      // last chunk may not have CHUNK_SIZE events
      break
    }
    const traces = [] as { eventId: string; trace: Trace }[]
    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      const eventId = event.event_id
      try {
        const res = await fetchTrace(eventId)
        const trace = res.data

        const traceMap = {
          eventId,
          trace,
        }
        traces.push(traceMap)
      } catch (e) {
        console.log(`Error when handling event ${eventId}`)
        return
      }
    }

    const tracesMap = traces.reduce(
      (acc, cur) => {
        acc[cur.eventId] = cur.trace
        return acc
      },
      {} as { [key: string]: Trace },
    )
    const basePath = isMainnet
      ? 'cache/events/mainnet/'
      : 'cache/events/testnet/'
    const path =
      basePath +
      `${index * CHUNK_SIZE}_to_${index * CHUNK_SIZE + events.length - 1}`

    fs.writeFileSync(`${path}.json`, JSON.stringify(tracesMap, null, 2))
    fileCount++
    console.log(`${events.length} events are indexed.`)
    const from = events[0].timestamp
    const to = events[events.length - 1].timestamp

    console.log(
      `${toLocaleString(from)} ~ ${toLocaleString(to)} / ${from} ~ ${to}`,
    )
  }

  console.log('totalEvents length: ', totalEvents)
  console.log(`${fileCount} files are generated.`)
}

generate()
