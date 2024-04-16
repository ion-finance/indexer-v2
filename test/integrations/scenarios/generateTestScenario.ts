import { ROUTER_REVISION_ADDRESS, Pool } from '@ion-finance/sdk'
import axios from 'axios'
import dotenv from 'dotenv'
import fs from 'fs'
import moment from 'moment'
import TonWeb from 'tonweb'

import fetchEvents from '../../../src/tasks/fetchEvents'
import { Trace } from '../../../src/types/ton-api'

dotenv.config()

const MAINNET = true
const ROUTER_ADDRESS = MAINNET
  ? ROUTER_REVISION_ADDRESS.V1
  : 'kQC3dzNkWKP8LrXOy9G8ULo8W1i11J0eF0f_wmkmt2OwfOfM'

// Mainnet
const MAINNET_POOLS = [
  'EQAxua2Q7nC9dJZwIt2566L820jPLT3ZJYT_HfNW0o_JjCQw',
  'EQCkoSqB9whEQijA-eS6mI1XXS9T9hzu7pu7wMpRJLPhH0uF',
]

// testnet
const TESTNET_POOLS = [
  'EQBaZhMmxSnaxANMWGJGiL6vxohpPPoGB4Hgq6xW2j5dsxgX',
  'EQDF5O_A2Ytvf2Z5I25kWydBtRX-CyqqAo1_RcY30R01AuBr',
  'EQCGNo76WobXzcjvsGMjiua9HVj64nUUtOoel6E95jgBkdOW',
  'EQBlxCMt0065nI1IuQamXZmC9RnG0nH0WBaoFkxHB7suw-8p',
  'EQAU0IItFJWm3dBFJmpA7msPNer6F0Lgg3-Qr1Cr1cUjDgLO',
  'EQD4bbpeQ0OXpvBRWjx2320amrPr8UBu2MD-6RvgKz4nsBz_',
  'EQAu-OglFsb5Ndn8eOMl39gbw-iKFelcr4zJatCYvKJNkJH6',
  'EQAYR3I9UYyRJF1qXu7ssuoIvCTDOTTUGoWIfABQyi1scGQe',
  'EQBwXaPf7OHBJAtPTpNDdS_Wuih8QlFLY_pmjbeVa3wmr2wW',
  'EQAMDZxxD9C9XNOL9xcMcQFsa6KBW90DMaUK8JsB3P9ccVzK',
]
const POOLS = MAINNET ? MAINNET_POOLS : TESTNET_POOLS

async function generate() {
  const events = await fetchEvents({
    routerAddress: ROUTER_ADDRESS,
    timestamp: 0,
  })

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

  const provider = new TonWeb.HttpProvider(process.env.TON_CENTER_API_URL, {
    apiKey: process.env.TON_CENTER_API_KEY,
  })

  const pools: {
    address: string
    reserve0: string
    reserve1: string
    token0Fee: string
    token1Fee: string
  }[] = []

  await Promise.all(
    POOLS.map(async (poolAddress) => {
      const pool = new Pool(provider, {
        revision: 'V1',
        address: poolAddress,
        adminAddress: new TonWeb.Address(
          'kQC3dzNkWKP8LrXOy9G8ULo8W1i11J0eF0f_wmkmt2OwfOfM', // dummy
        ),
        jettonContentUri: 'testnet', // dummy
        jettonWalletCodeHex: 'test', // dummy
      })

      const poolData = await pool.getData()
      pools.push({
        address: poolAddress.toString(),
        reserve0: poolData.reserve0.toString(),
        reserve1: poolData.reserve1.toString(),
        token0Fee: poolData.collectedToken0ProtocolFee.toString(),
        token1Fee: poolData.collectedToken1ProtocolFee.toString(),
      })
    }),
  )

  const testSuite = {
    events: data,
    pools: pools,
    routerAddress: ROUTER_ADDRESS,
  }

  fs.writeFileSync(
    `test/integrations/scenarios/${moment().format('YYYYMMDD_h:mm:ss')}_${MAINNET ? 'mainnet' : 'testnet'}.json`,
    JSON.stringify(testSuite, null, 2),
  )
}

generate()
