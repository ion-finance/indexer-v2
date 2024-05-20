import * as Sentry from '@sentry/node'
import {
  Cell,
  CommonMessageInfo,
  Dictionary,
  Message,
  TonClient,
  address,
} from '@ton/ton'
import dotenv from 'dotenv'
import { compact, drop, map } from 'lodash'

import api from 'src/api'
import prisma from 'src/clients/prisma'
import { routerAddress } from 'src/constant/address'

import { updateBaseTokenPrices } from './common/updateTokenPrices'
import { MIN_POOL, PORT, isCLMM } from './constant'
import { fetchTrace } from './fetch'
import { getEventSummary, getTrace } from './redisClient'
import seedCLMM from './scripts/seedCLMM'
import fetchEvents from './tasks/fetchTransactions'
import handleEvent from './tasks/handleEvent'
import { OP } from './tasks/handleEvent/opCode'
import { CachedEvent } from './types/events'
import { AccountEvent } from './types/ton-api'
import { toLocaleString } from './utils/date'
import { info, logError, warn } from './utils/log'

dotenv.config()

// Sentry.init({
//   dsn: process.env.SENTRY_DSN,
// })

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const tonClient = new TonClient({
  endpoint: 'https://toncenter.com/api/v2/jsonRPC',
  apiKey: process.env.TONCENTER_API_KEY,
})
const events = []

const poolAddress = 'EQB6b9o1okF2H6YZhO0gLuMCgzYoLePdELKtlKFmqwfn3fzf'
let lt = ''
let hash = ''
const init = async () => {
  await sleep(3000)
  // const routerAddress = process.env.ROUTER_ADDRESS || routerAddress
  // const res = await tonClient.getTransactions(address(poolAddress), {
  console.log('lt, hash', lt, hash)
  let res = [] as any[]
  try {
    res = await tonClient.getTransactions(address(routerAddress), {
      lt: lt ? lt : undefined,
      hash: hash,
      limit: 100,
      archival: true,
    })
  } catch (e) {
    console.log('error', e)
  }
  console.log('res.length', res.length)

  if (res.length === 0) {
    console.log('fetch finished')
    console.log('events.length finished', events.length)
    return
  } else {
    events.push(...res)
    console.log('events.length', events.length)
  }
  lt = res[res.length - 1].lt.toString()
  hash = res[res.length - 1].hash().toString('base64')

  const parseInMessage = (inMessage: Message) => {
    const { info, body } = inMessage
    return {
      info,
      // body: body.toBoc().toString('base64'),
      body,
    }
  }

  const parseOutMessages = (outMessages: Dictionary<number, Message>) => {
    const keys = outMessages.keys()
    const msgs = map(keys, (key) => {
      const msg = outMessages.get(key)
      if (!msg) {
        return null
      }
      return {
        info: msg.info,
        // body: msg.body.toBoc().toString('base64'),
        body: msg.body,
      }
    })
    return compact(msgs)
  }

  // const txs = res.map((tx) => {
  //   const { inMessage, outMessages } = tx
  //   const parsedInMessage = inMessage ? parseInMessage(inMessage) : undefined
  //   const parsedOutMessages = parseOutMessages(outMessages)

  //   return {
  //     id: tx.hash().toString('base64'),
  //     lt: tx.lt,
  //     inMessage: parsedInMessage,
  //     outMessages: parsedOutMessages,
  //   }
  // })

  // for (let i = 0; i < txs.length; i++) {
  //   const tx = txs[i]
  //   const inMessage = tx.inMessage
  //   const outMessages = tx.outMessages
  //   console.log('outMessages', outMessages)
  //   // console.log('tx', tx)
  //   // console.log('inMessage', inMessage)
  //   // console.log('outMessages', outMessages)

  //   try {
  //     console.group(`tx=${tx.id}`)
  //     console.log('inMessage')
  //     parseMessage(inMessage)

  //     for (let j = 0; j < outMessages.length; j++) {
  //       console.log('outMessages')
  //       const message = outMessages[j]
  //       parseMessage(message)
  //     }
  //     console.groupEnd()
  //   } catch (e) {
  //     console.log(`Parsing cell error in tx=${tx.id}`)
  //     console.log(e)
  //   }
  // }
}

const parseMessage = (message?: Message) => {
  if (!message) {
    return null
  }
  const { info, body } = message
  // const cell = Cell.fromBase64(body)
  const cell = body
  const msg = cell.beginParse()
  const op = msg.loadUint(32).toString(16)
  msg.loadUint(64) // skip query_id
  console.log('op', op)
  const opKey = OP['0x' + op]
  console.log('opKey', opKey)
}

const main = async () => {
  info('Event pooling is started. ')
  // await updateBaseTokenPrices()
  if (isCLMM) {
    // await seedCLMM()
  } else {
    await init()
    for (;;) {
      // await eventPooling()
    }
  }
}

main()

api.listen(PORT, () => {
  info(`Server listening on port ${PORT}`)
})
