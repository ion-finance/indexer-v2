import { Cell, Message } from '@ton/core'
import { Maybe } from '@ton/core/dist/utils/maybe'
import { compact, find, map, some } from 'lodash'

import {
  getCachedPoolTxFromNextHash,
  getCachedPoolTxFromPrevHash,
  getLpAccountTxFromCache,
  getRouterTxsFromCache,
  saveLpAccountTxsToCache,
  savePoolTxsToCache,
} from './redisClient'
import fetchTransactions from './tasks/fetchTransactions'
import { normalizeOpcode } from './tasks/handleRouterTransaction/opCode'
import { ParsedTransaction, TransactionWithHash } from './types/ton-center'
import { warn } from './utils/log'

export const checkTxHasOp = ({
  tx,
  inMessageOp,
  outMessageOp,
}: {
  tx?: ParsedTransaction | null
  inMessageOp: string
  outMessageOp?: string
}) => {
  if (!tx?.inMessage) {
    return false
  }
  const inMessageOpHex = tx.inMessage?.opHex
  const hasCorrectInMsgOp = inMessageOpHex === inMessageOp

  const hasCorrectOutMsgOp = (function () {
    if (!outMessageOp) {
      return true
    }
    return some(tx.outMessages, (outMessage) => {
      return outMessage.opHex === outMessageOp
    })
  })()
  return hasCorrectInMsgOp && hasCorrectOutMsgOp
}

export const findTx = ({
  txs,
  inMessageHash,
  inMessageOp,
  outMessageOp,
}: {
  txs: ParsedTransaction[]
  inMessageHash: string
  inMessageOp: string
  outMessageOp?: string
}) => {
  return txs.find((tx) => {
    const sameHash = tx.inMessage?.msg === inMessageHash
    const matched = checkTxHasOp({
      tx,
      inMessageOp,
      outMessageOp,
    })
    return matched && sameHash
  })
}

export const parseTransaction = (
  tx: TransactionWithHash,
): ParsedTransaction => {
  if (!tx.inMessage?.body.toBoc().toString('base64')) {
    warn('Empty inMessage')
    return {
      hash: tx.hash,
      lt: Number(tx.lt),
      now: tx.now,
      hashHex: tx.hashHex,
      inMessage: null,
      outMessages: null,
      firstOutMessage: null,
      oldStatus: tx.oldStatus,
      endStatus: tx.endStatus,
    }
  }

  const parseMessage = (txMessage: Maybe<Message>) => {
    const msg = txMessage?.body.toBoc().toString('base64')
    const parsedInfo = (function () {
      const info = txMessage?.info
      if (!info) {
        return null
      }
      return {
        src: info.src?.toString(),
        dest: info.dest?.toString(),
      }
    })()

    if (!msg) {
      return null
    }
    const ROUTER_DEPLOY_MESSAGE = 'te6cckEBAQEAAgAAAEysuc0='
    if (msg === ROUTER_DEPLOY_MESSAGE) {
      return null
    }

    const cell = Cell.fromBase64(msg)
    const slice = cell.beginParse()
    const op = slice.loadUint(32).toString(16)
    const queryId = slice.loadUint(64) // skip query_id
    const opHex = normalizeOpcode(op) // pad '0' for 7 digit hex
    return {
      op,
      opHex,
      queryId,
      info: parsedInfo,
      msg,
    }
  }
  const ourMessages = tx.outMessages.values()
  const inMessage = parseMessage(tx.inMessage)
  const firstOutMessage = parseMessage(ourMessages[0])
  const outMessages = compact(
    map(ourMessages, (outMessage) => parseMessage(outMessage)),
  )
  const { hash, lt, now, hashHex, oldStatus, endStatus } = tx
  return {
    hash,
    lt: Number(lt),
    now,
    hashHex,
    oldStatus,
    endStatus,
    inMessage,
    outMessages,
    firstOutMessage,
  }
}

export const loadCachedRouterTxs = async () =>
  await getRouterTxsFromCache(0, -1)

export const getPoolTransactionFromPrevHash = async ({
  poolAddress,
  inMessageHash,
  prevHashLt,
  toLt,
}: {
  poolAddress: string
  inMessageHash?: string
  outMessageHash?: string
  prevHashLt: number
  toLt?: string
}) => {
  if (!inMessageHash) {
    return undefined
  }
  const poolTx = await getCachedPoolTxFromPrevHash({
    poolAddress,
    prevHashLt,
    inMessageHash,
  })
  if (poolTx) {
    return poolTx
  }
  console.log('not cached prev', prevHashLt)
  console.log(`poolAddress:${poolAddress}::inMessageHash:${inMessageHash}`)

  const poolTxs = await fetchTransactions({
    contractAddress: poolAddress,
    toLt,
  })
  const parsed = compact(map(poolTxs, (tx) => parseTransaction(tx)))
  await savePoolTxsToCache(poolAddress, parsed)
  return find(parsed, (tx) => tx.inMessage?.msg === inMessageHash)
}

export const getPoolTransactionFromNextHash = async ({
  poolAddress,
  outMessageHash,
  nextHashLt,
  toLt,
}: {
  poolAddress: string
  outMessageHash?: string
  nextHashLt: number
  toLt?: string
}) => {
  if (!outMessageHash) {
    return undefined
  }
  const poolTx = await getCachedPoolTxFromNextHash({
    poolAddress,
    nextHashLt,
    outMessageHash,
  })

  if (poolTx) {
    return poolTx
  }
  console.log('not cached next', nextHashLt)
  console.log(`poolAddress:${poolAddress}::outMessageHash:${outMessageHash}`)

  const poolTxs = await fetchTransactions({
    contractAddress: poolAddress,
    toLt,
  })
  const parsed = compact(map(poolTxs, (tx) => parseTransaction(tx)))
  await savePoolTxsToCache(poolAddress, parsed)
  return find(parsed, (tx) => tx.inMessage?.msg === outMessageHash)
}

export const getLpAccountTransactionWithCache = async ({
  lpAccountAddress,
  inMessageHash,
  prevHashLt,
  toLt,
}: {
  lpAccountAddress: string
  inMessageHash?: string
  prevHashLt: number
  toLt?: string
}) => {
  const lpAccountTx = await getLpAccountTxFromCache(
    lpAccountAddress,
    prevHashLt,
    inMessageHash,
  )
  if (lpAccountTx) {
    return lpAccountTx
  }
  const lpAccountTxs = await fetchTransactions({
    contractAddress: lpAccountAddress,
    toLt,
  })
  const parsed = compact(map(lpAccountTxs, (tx) => parseTransaction(tx)))
  await saveLpAccountTxsToCache(lpAccountAddress, parsed)
  return find(parsed, (tx) => tx.inMessage?.msg === inMessageHash)
}

export const findOutMessage = (tx: ParsedTransaction, op: string) => {
  return tx.outMessages?.find((outMessage) => outMessage.opHex === op)
}
