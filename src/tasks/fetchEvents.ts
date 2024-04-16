import axios from 'axios'
import { sortBy, uniqBy } from 'lodash'

import { AccountEvent, Event } from 'src/types/ton-api'
import { toLocaleString } from 'src/utils/date'

// import * as Sentry from "@sentry/node";

let lastEvent: AccountEvent
const fetchEvents = async ({
  routerAddress,
  timestamp = 0,
}: {
  routerAddress: string
  timestamp?: number
}) => {
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
      const sorted = sortBy(parsedEvents, (e) => e.timestamp, 'asc')
      events.push(...sorted)

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

  const orderedEvents = sortBy(events, (e) => e.timestamp, 'asc')
  // !NOTE: events can be duplicated, remove duplicated events
  // when fetch with start_date 1711630630, 1711630633 can be
  const uniqEvents = uniqBy(orderedEvents, (e) => e.event_id)

  lastEvent = uniqEvents[uniqEvents.length - 1]

  return uniqEvents
}

export default fetchEvents
