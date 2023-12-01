import axios from "axios";
import prisma from "../clients/prisma";
import { Event } from "../types/ton-api";

const fetchEvents = async () => {
  const timestamp = await prisma.indexerState.getLastTimestamp();
  const res = await axios(
    `${process.env.TON_API_URL}/accounts/${process.env.ROUTER_ADDRESS}/events?start_date=${timestamp}&limit=100`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TON_API_KEY}`,
      },
    }
  );

  const events = res.data.events as Event[];

  return events;
};

export default fetchEvents;
