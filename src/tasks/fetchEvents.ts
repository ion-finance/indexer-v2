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
  const baseUrl = `${process.env.TON_API_URL}/accounts/${routerAddress}/events`
  const events: AccountEvent[] = []

  const fetch = async (start_date: number, before_lt: number) => {
    // const args = `start_date=${start_date}&before_lt=${before_lt}&limit=100`
    const args = (function () {
      if (!before_lt) {
        return `start_date=${start_date}&limit=100`
      }
      return `start_date=${start_date}&before_lt=${before_lt}&limit=100`
    })()
    const url = `${baseUrl}?${args}`
    // res data is ordered by timestamp, lt desc
    const res = await axios<AccountEvents>(url, {
      headers: {
        Authorization: `Bearer ${process.env.TON_API_KEY}`,
      },
    })

    return res
  }

  for (;;) {
    try {
      const res = await fetch(timestamp, beforeLt)
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
    } catch (e: any) {
      // TODO: remove, this code is awful. It is because of misbehavior of ton api.
      // after ton api fix fetching issue remove below code (if clause).
      if (
        e.response.data.error ===
        'parent tx for 72dbee85f0612047e3dc941015d2db5d not found'
      ) {
        const timestamp = 1714816555
        const res1 = await fetch(timestamp, beforeLt)
        const accountEvents1 = sortBy(
          res1.data.events.filter((e) => !e.in_progress),
          (e) => e.timestamp,
          'asc',
        )
        events.push(...accountEvents1)
        const startDate2 = 0
        const beforeLt2 = 46288954000001
        const res2 = await fetch(startDate2, beforeLt2)
        const accountEvents2 = sortBy(
          res2.data.events.filter((e) => !e.in_progress),
          (e) => e.timestamp,
          'asc',
        )
        events.push(...accountEvents2)

        const nextFrom = res2.data.next_from
        if (accountEvents2.length >= 100) {
          info(`fetched with start_date, before_lt, ${timestamp} ${beforeLt}`)
          // TON API limit is 100 events per request.
          // If 100 events are found, we need to fetch evetns more precisely.
          // It we don't this, we may miss some events.
          info('More than 100 events found.')
          // there should be padding. because 'before_lt' is exclusive with padding. (30 is empirical value)
          beforeLt = nextFrom + LOGICAL_TIME_PADDING
          info(`Try to fetch events beforeLt, ${beforeLt}`)
        }
        continue
      }
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
