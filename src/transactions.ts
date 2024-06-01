import { Cell, Message } from '@ton/core'
import { Maybe } from '@ton/core/dist/utils/maybe'
import { compact, filter, find, map, some } from 'lodash'

import { routerAddress } from './constant/address'
import {
  getCachedPoolTxFromNextHash,
  getCachedPoolTxFromPrevHash,
  getLpAccountTxFromCache,
  getRouterTxsFromCache,
  saveLpAccountTxsToCache,
  savePoolTxsToCache,
} from './redisClient'
import fetchTransactions from './tasks/fetchTransactions'
import { OP, normalizeOpcode } from './tasks/handleRouterTransaction/opCode'
import { ParsedTransaction, TransactionWithHash } from './types/ton-center'
import { warn } from './utils/log'
import sleep from './utils/sleep'

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

export const getRouterTransactionFromPrevHash = async ({
  toLt,
  inMessageHash,
}: {
  toLt?: string
  inMessageHash: string
}) => {
  const allCachedTxs = await loadCachedRouterTxs()
  const cachedTxs = toLt
    ? filter(allCachedTxs, (tx) => Number(toLt) <= Number(tx.lt))
    : allCachedTxs

  const txFromCached = find(
    cachedTxs,
    (tx) => tx.inMessage?.msg === inMessageHash,
  )
  if (txFromCached) {
    return txFromCached
  }

  const { tx } = await findTxWithWait({
    contractAddress: routerAddress,
    toLt,
    inMessageHash,
  })
  return tx
}

export const findTxWithWait = async ({
  contractAddress,
  toLt,
  inMessageHash,
}: {
  contractAddress: string
  toLt?: string
  inMessageHash: string
}) => {
  let tx = undefined as ParsedTransaction | undefined
  let parsed = [] as ParsedTransaction[]

  while (!tx) {
    const txs = await fetchTransactions({
      contractAddress,
      toLt,
    })
    parsed = compact(map(txs, (tx) => parseTransaction(tx)))
    tx = find(parsed, (tx) => tx.inMessage?.msg === inMessageHash)
    await sleep(2000)
  }
  return { tx, parsed }
}

export const findTxWithWaitOutMessage = async ({
  contractAddress,
  outMessageHash,
}: {
  contractAddress: string
  outMessageHash: string
}) => {
  let tx = undefined as ParsedTransaction | undefined
  let parsed = [] as ParsedTransaction[]

  while (!tx) {
    const txs = await fetchTransactions({
      contractAddress,
    })
    parsed = compact(map(txs, (tx) => parseTransaction(tx)))
    tx = find(parsed, (tx) => {
      return some(
        tx.outMessages,
        (outMessage) => outMessage.msg === outMessageHash,
      )
    })
    await sleep(2000)
  }
  return { tx, parsed }
}

export const getPoolTransactionFromPrevHash = async ({
  poolAddress,
  inMessageHash,
  prevHashLt,
  toLt,
}: {
  poolAddress: string
  inMessageHash?: string
  prevHashLt: number
  toLt?: string
}) => {
  if (!inMessageHash) {
    return undefined
  }
  const cached = await getCachedPoolTxFromPrevHash({
    poolAddress,
    prevHashLt,
    inMessageHash,
  })
  if (cached) {
    return cached
  }
  // console.log('not cached prev', prevHashLt)
  // console.log(`poolAddress:${poolAddress}::inMessageHash:${inMessageHash}`)

  const { tx, parsed } = await findTxWithWait({
    contractAddress: poolAddress,
    toLt,
    inMessageHash,
  })
  await savePoolTxsToCache(poolAddress, parsed)
  return tx
}

export const getPoolTransactionFromNextHash = async ({
  poolAddress,
  outMessageHash,
  nextHashLt,
}: {
  poolAddress: string
  outMessageHash?: string
  nextHashLt: number
}) => {
  if (!outMessageHash) {
    return undefined
  }
  const cached = await getCachedPoolTxFromNextHash({
    poolAddress,
    nextHashLt,
    outMessageHash,
  })

  if (cached) {
    return cached
  }
  // console.log('not cached next', nextHashLt)
  // console.log(`poolAddress:${poolAddress}::outMessageHash:${outMessageHash}`)

  // do not use 'toLt' because it search from the next hash
  const { tx, parsed } = await findTxWithWaitOutMessage({
    contractAddress: poolAddress,
    outMessageHash,
  })
  await savePoolTxsToCache(poolAddress, parsed)
  return tx
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
  if (!inMessageHash) {
    return undefined
  }
  const cached = await getLpAccountTxFromCache(
    lpAccountAddress,
    prevHashLt,
    inMessageHash,
  )
  if (cached) {
    return cached
  }
  const { tx, parsed } = await findTxWithWait({
    contractAddress: lpAccountAddress,
    toLt,
    inMessageHash,
  })
  await saveLpAccountTxsToCache(lpAccountAddress, parsed)
  return tx
}

export const findOutMessageWithOp = (tx: ParsedTransaction, op: string) => {
  return find(tx.outMessages, (outMessage) => outMessage.opHex === op)
}

const ALREADY_CHECKED_TXS = [
  '438f3d8122c3b96a035fc68a9fa9e720afae0811d9e339b76bba4c77abd74fee', //router init
  'b1fe8b5a5fbaa9274ac0510849040e8e5fb87d9bf2bd1cabcb35648c9b27ca7a', // exit code 87
  'a9f1dc95e4f352ddd8671e220eb17cb022cb390735865a204c824d21aff0a6f2', //multisend
  '6a044aef1a76514fb67c3bb0a12124b3229ce677b920e9343f64b53fb2ca710b', // exit code 87
  'd60edec3cc9b6d1d0cae614013f7d541c494d01fe60817776724093b908ef54b', // exit code 9
  '0bf58db87a2eac5287df6624deb2a059b65a09f551472adcdf67941b044b687d', // exit code 9
  '4ed90de2cdc544dea283889c6fd5134506e0e8924ec9d8c910be9f4980d498f2', // exit code 9
  '2c67c938e360c9149fbb24eb5c36c46867ff64df957e57a98503f6dca3d656d7', // exit code 65535
  '32f95a8f52345a71c789bcb50ce9142761094d6b4218f3ac165d80fd4a920d91', // exit code 9
  '8d500b78be2a7a6ea51e6eaf16219f515d1906c990decddd710c22fec776af66', // multisend
] as string[]

export const logUnknownTransaction = (tx: ParsedTransaction) => {
  const isAlreadyChecked = ALREADY_CHECKED_TXS.includes(tx.hashHex)
  const hasNFTTransfer = tx.inMessage?.opHex === OP.NFT_TRANSFER
  const hasTextComment = tx.inMessage?.opHex === OP.TEXT_COMMENT
  if (isAlreadyChecked) {
    console.log(`Already checked, tx: ${tx.hashHex}`)
  } else if (hasNFTTransfer) {
    console.log(`NFT Transfer, tx: ${tx.hashHex}`)
  } else if (hasTextComment) {
    console.log(`Text Comment, tx: ${tx.hashHex}`)
  } else {
    console.log(
      `Unknown Transaction \ntx.hashHex: ${tx.hashHex}, tx.lt: ${tx.lt}, tx.inMessage?.opHex: ${tx.inMessage?.opHex}, tx.outMessages?.[0]?.opHex: ${tx.outMessages?.[0]?.opHex}`,
    )
  }
}
