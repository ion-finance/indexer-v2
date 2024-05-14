import axios from 'axios'
import { sortBy, uniqBy } from 'lodash'

import { AccountEvent, AccountEvents } from 'src/types/ton-api'
import { error, info, logError } from 'src/utils/log'

// import * as Sentry from "@sentry/node";
const LOGICAL_TIME_PADDING = 30
const fetchEvents = async ({
  routerAddress,
  timestamp = 0,
}: {
  routerAddress: string
  timestamp?: number
}) => {
  let beforeLt = 0
  const events: AccountEvent[] = []

  for (;;) {
    const baseUrl = `${process.env.TON_API_URL}/accounts/${routerAddress}/events`
    try {
      const args =
        `start_date=${timestamp}&limit=100` +
        (beforeLt ? `&before_lt=${beforeLt}` : '')

      const url = `${baseUrl}?${args}`
      // res data is ordered by timestamp desc
      const res = await axios<AccountEvents>(url, {
        headers: {
          Authorization: `Bearer ${process.env.TON_API_KEY}`,
        },
      })

      const accountEvents = sortBy(
        res.data.events.filter((e) => !e.in_progress),
        (e) => e.timestamp,
        'asc',
      )
      events.push(...accountEvents)
      const nextFrom = res.data.next_from

      if (accountEvents.length >= 100) {
        info(`fetched with start_date, before_lt, ${timestamp} ${beforeLt}`)
        // TON API limit is 100 events per request.
        // If 100 events are found, we need to fetch evetns more precisely.
        // It we don't this, we may miss some events.
        info('More than 100 events found.')
        // there should be padding. because 'before_lt' is exclusive with padding. (30 is empirical value)
        beforeLt = nextFrom + LOGICAL_TIME_PADDING
        info(`Try to fetch events beforeLt, ${beforeLt}`)
        continue
      }

      break
    } catch (e) {
      error(`Error fetching events in url, ${baseUrl}`)
      logError(e)
      // Sentry.captureException(e);
      break
    }
  }

  if (events.length === 0) {
    return []
  }

  const orderedEvents = sortBy(events, (e) => e.timestamp, 'asc')
  const uniqEvents = uniqBy(orderedEvents, (e) => e.event_id)
  return uniqEvents
}

export default fetchEvents
