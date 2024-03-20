import axios from "axios";
import prisma from "../clients/prisma";
import { Event } from "../types/ton-api";
import * as Sentry from "@sentry/node";

const fetchEvents = async (): Promise<Event[]> => {
  const timestamp = await prisma.indexerState.getLastTimestamp();
  let endDate = 0;
  let events: Event[] = [];

  for (;;) {
    try {
      const args =
        `start_date=${timestamp}&limit=100` +
        (endDate ? `&end_date=${endDate}` : "");

      const res = await axios(
        `${process.env.TON_API_URL}/accounts/${process.env.ROUTER_ADDRESS}/events?${args}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.TON_API_KEY}`,
          },
        }
      );

      const parsedEvents = res.data.events as Event[];

      if (parsedEvents.length >= 100) {
        // TON API limit is 100 events per request.
        // If 100 events are found, we need to fetch evetns more precisely.
        // It we don't this, we may miss some events.
        console.log("More than 100 events found.");
        endDate = parsedEvents[Math.floor(parsedEvents.length / 2)].timestamp;
        console.log(
          "Try to fetch events endData ",
          endDate,
          new Date(endDate * 1000)
        );
        continue;
      }

      events = res.data.events.filter(
        (event: Event) => event.in_progress === false
      );

      break;
    } catch (e) {
      console.error("Error fetching events", e);
      // Sentry.captureException(e);
      break;
    }
  }

  return events;
};

export default fetchEvents;
