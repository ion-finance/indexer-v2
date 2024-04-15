import axios from 'axios'
import fetchEvents from '../../../src/tasks/fetchEvents'
import { Trace } from '../../../src/types/ton-api'
import TonWeb from 'tonweb'
import {
  Router,
  ROUTER_REVISION,
  ROUTER_REVISION_ADDRESS,
  PTON,
} from '@ion-finance/sdk'
import fs from 'fs'
import moment from 'moment'

const JETTON0 = 'EQCIzrS1j1D7pBAmxysoXXvwL6OfbmBlqLlmUdSfte2fPqdJ' // THANOS
const JETTON1 = 'EQC54miSZW6HoGRq6eb2lT0ciSYSWwfdFWVxvrjQwXgmzWpH' // Brrr
const TON_CENTER_API_KEY = process.env.TON_CENTER_API_KEY

async function generate() {
  const events = await fetchEvents(ROUTER_REVISION_ADDRESS.V1)

  const data: {
    eventId: string
    trace: Trace
  }[] = []

  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const eventId = event.event_id
    const res = await axios(`${process.env.TON_API_URL}/traces/${eventId}`, {
      headers: {
        Authorization: `Bearer ${process.env.TON_API_KEY}`,
      },
    })

    data.push({
      eventId: eventId,
      trace: res.data as Trace,
    })
  }

  // fetch pool storage from contract
  const provider = new TonWeb.HttpProvider(
    'https://toncenter.com/api/v2/jsonRPC',
    { apiKey: TON_CENTER_API_KEY },
  )

  const router = new Router(provider, {
    revision: ROUTER_REVISION.V1,
    address: ROUTER_REVISION_ADDRESS.V1,
  })

  // Brrr - THANOS
  const pool = await router.getPool({ jettonAddresses: [JETTON0, JETTON1] })
  const poolAddress = await pool!.getAddress()
  const poolData = await pool!.getData()

  // THANOS - ton pool
  const pool2 = await router.getPool({ jettonAddresses: [PTON, JETTON0] })
  const poolAddress2 = await pool2!.getAddress()
  const poolData2 = await pool2!.getData()

  const testSuite = {
    events: data,
    pools: [
      {
        address: poolAddress.toString(),
        reserve0: poolData.reserve0.toString(),
        reserve1: poolData.reserve1.toString(),
        token0Fee: poolData.collectedToken0ProtocolFee.toString(),
        token1Fee: poolData.collectedToken1ProtocolFee.toString(),
      },
      {
        address: poolAddress2.toString(),
        reserve0: poolData2.reserve0.toString(),
        reserve1: poolData2.reserve1.toString(),
        token0Fee: poolData2.collectedToken0ProtocolFee.toString(),
        token1Fee: poolData2.collectedToken1ProtocolFee.toString(),
      },
    ],
  }

  fs.writeFileSync(
    `test/integrations/data/${moment().format('YYYYMMDD_h:mm:ss')}.json`,
    JSON.stringify(testSuite, null, 2),
  )
}

generate()
