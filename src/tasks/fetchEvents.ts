import axios from 'axios'
import { AccountEvent, Event } from '../types/ton-api'
import prisma from '../clients/prisma'
import { uniqBy } from 'lodash'
import { routerAddress } from '../address'
import { toLocaleString } from '../utils/date'

// import * as Sentry from "@sentry/node";

let lastEvent: AccountEvent
const fetchEvents = async () => {
  const timestamp = await prisma.indexerState.getLastTimestamp()
  // do not fetch the last event
  let endDate = 0
  const events: AccountEvent[] = []

  for (;;) {
    try {
      const args =
        `start_date=${timestamp}&limit=100` +
        (endDate ? `&end_date=${endDate}` : '')

      const url = `${process.env.TON_API_URL}/accounts/${routerAddress}/events?${args}`
      const res = await axios(url, {
        headers: {
          Authorization: `Bearer ${process.env.TON_API_KEY}`,
        },
      })

      const parsedEvents = res.data.events.filter(
        (event: Event) => event.in_progress === false,
      ) as AccountEvent[]
      // TODO: sort by timestamp
      events.push(...parsedEvents)

      if (parsedEvents.length >= 100) {
        // TON API limit is 100 events per request.
        // If 100 events are found, we need to fetch evetns more precisely.
        // It we don't this, we may miss some events.
        console.log('More than 100 events found.')
        // endDate = parsedEvents[Math.floor(parsedEvents.length / 2)].timestamp;
        endDate = parsedEvents[parsedEvents.length - 1].timestamp
        console.log(
          'Try to fetch events endData ',
          toLocaleString(endDate),
          endDate,
        )
        continue
      }

      break
    } catch (e) {
      console.error('Error fetching events', e)
      // Sentry.captureException(e);
      break
    }
  }
  // event
  if (events.length === 1 && events[0].event_id === lastEvent?.event_id) {
    return []
  }

  const orderedEvents = events.sort((a, b) => a.timestamp - b.timestamp)
  // !NOTE: events can be duplicated, remove duplicated events
  // when fetch with start_date 1711630630, 1711630633 can be
  const uniqEvents = uniqBy(orderedEvents, (e) => e.event_id)

  lastEvent = uniqEvents[uniqEvents.length - 1]

  return uniqEvents
}

export default fetchEvents
