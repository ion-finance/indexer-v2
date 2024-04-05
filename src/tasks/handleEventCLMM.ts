import axios from 'axios'
import { Trace } from '../types/ton-api'
import { Address, Cell } from '@ton/core'
import {
  handleDepositedToBins,
  handleInitialized,
  handleSwap,
  handleTransferBatch,
  handleOrderPlaced,
  handleOrderCancelled,
  handleOrderClaimed,
  handleOrderExecuted,
} from '../mappings/clmm'
// CLMM
const DEPOSITED_TO_BINS = '0xafeb11ef'
const INITIALIZED = '0x9bb3a52e'
const SWAP = '0x25938561'
const TRANSFER_BATCH = '0x5b8fa78c'
const WITHDRAWN_FROM_BINS = '0xf6172b31'
const ORDER_PLACED = '0xbef3f947'
const ORDER_CANCELLED = '0x4572803f'
const ORDER_EXECUTED = '0x18b134be'
const ORDER_CLAIMED = '0x5e586bc8'

// Info
// * This method can throw an error if the event is processing
const handleEventCLMM = async (event_id: string) => {
  const res = await axios(`${process.env.TON_API_URL}/traces/${event_id}`, {
    headers: {
      Authorization: `Bearer ${process.env.TON_API_KEY}`,
    },
  })

  const transactionRes = res.data as Trace

  let txs = [transactionRes]
  const txsHasOutMsgs: Trace[] = []
  while (txs.length != 0) {
    let new_txs: Trace[] = []

    txs.forEach((t) => {
      if (t.transaction.out_msgs.length > 0) {
        txsHasOutMsgs.push({
          ...t,
          children: undefined,
        })
      }

      if (t.children) {
        new_txs = [...new_txs, ...t.children]
      }
    })

    txs = new_txs
  }

  for (let i = 0; i < txsHasOutMsgs.length; i++) {
    const tx = txsHasOutMsgs[i]
    for (let j = 0; j < tx.transaction.out_msgs.length; j++) {
      const msg = tx.transaction.out_msgs[j]
      const body = Cell.fromBoc(Buffer.from(msg.raw_body || '', 'hex'))[0]
      const transaction = {
        source: Address.parseRaw(tx.transaction.account.address).toString(),
        hash: tx.transaction.hash,
        timestamp: tx.transaction.utime,
        eventId: event_id,
      }

      switch (msg.op_code) {
        case DEPOSITED_TO_BINS: {
          await handleDepositedToBins({
            transaction,
            body,
          })
          break
        }
        case INITIALIZED: {
          await handleInitialized({
            transaction,
            body,
          })
          break
        }
        case SWAP: {
          await handleSwap({
            transaction,
            body,
          })
          break
        }
        case TRANSFER_BATCH: {
          await handleTransferBatch({
            transaction,
            body,
          })
          break
        }
        case WITHDRAWN_FROM_BINS: {
          // !NOTE: disable withdraw on version pre-alpha-contract
          // await handleWithdrawnFromBins({
          //   transaction,
          //   body,
          // });
          break
        }
        case ORDER_PLACED: {
          await handleOrderPlaced({
            transaction,
            body,
          })
          break
        }
        case ORDER_CANCELLED: {
          await handleOrderCancelled({
            transaction,
            body,
          })
          break
        }
        case ORDER_CLAIMED: {
          await handleOrderClaimed({
            transaction,
            body,
          })
          break
        }
        case ORDER_EXECUTED: {
          await handleOrderExecuted({
            transaction,
            body,
          })
          break
        }
        default:
          console.log('UNKNOWN OP_CODE:', msg.op_code)
          break
      }
    }
  }
}

export default handleEventCLMM
