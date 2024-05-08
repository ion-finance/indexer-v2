import axios from 'axios'

import { Trace } from 'src/types/ton-api'

export const fetchTrace = async (eventId: string) => {
  return await axios<Trace>(`${process.env.TON_API_URL}/traces/${eventId}`, {
    headers: {
      Authorization: `Bearer ${process.env.TON_API_KEY}`,
    },
  })
}
