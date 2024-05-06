import axios from 'axios'
import { sortBy, uniqBy } from 'lodash'

import { AccountEvent, AccountEvents } from 'src/types/ton-api'
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
    const baseUrl = `${process.env.TON_API_URL}/accounts/${routerAddress}/events`
    try {
      const args =
        `start_date=${timestamp}&limit=100` +
        (endDate ? `&end_date=${endDate}` : '')

      const url = `${baseUrl}?${args}`
      const res = await axios<AccountEvents>(url, {
        headers: {
          Authorization: `Bearer ${process.env.TON_API_KEY}`,
        },
      })

      const accountEvents = [] as AccountEvent[]
      res.data.events.forEach((event) => {
        if (event.in_progress === true) {
          console.log('Event is in progress. Skip it.', event.event_id, url)
        } else {
          accountEvents.push(event)
        }
      })
      // const parsedEvents = res.data.events.filter(
      //   (event: Event) => event.in_progress === false,
      // ) as AccountEvent[]
      const sorted = sortBy(accountEvents, (e) => e.timestamp, 'asc')
      events.push(...sorted)

      if (accountEvents.length >= 100) {
        // TON API limit is 100 events per request.
        // If 100 events are found, we need to fetch evetns more precisely.
        // It we don't this, we may miss some events.
        console.log('More than 100 events found.')
        // endDate = accountEvents[Math.floor(accountEvents.length / 2)].timestamp;
        endDate = accountEvents[accountEvents.length - 1].timestamp
        console.log(
          'Try to fetch events endData ',
          toLocaleString(endDate),
          endDate,
        )
        continue
      }

      break
    } catch (e) {
      console.error('Error fetching events in url', baseUrl)
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
      // Sentry.captureException(e);
      break
    }
  }
  // event
  if (events.length === 1 && events[0].event_id === lastEvent?.event_id) {
    return []
  }
  if (events.length === 0) {
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
