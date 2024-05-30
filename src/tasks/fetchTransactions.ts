import { Address, TonClient, Transaction } from '@ton/ton'
import dotenv from 'dotenv'
import { map, sortBy, uniqBy } from 'lodash'

import { isMainnet } from 'src/constant'
import { TransactionWithHash } from 'src/types/ton-center'
import { error, info, logError, warn } from 'src/utils/log'
dotenv.config()

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const FETCH_LENGTH = 100
const mainnetEndpoint = 'https://toncenter.com/api/v2/jsonRPC'
const testnetEndpoint = 'https://testnet.toncenter.com/api/v2/jsonRPC'
const tonClient = new TonClient({
  endpoint: isMainnet ? mainnetEndpoint : testnetEndpoint,
  apiKey: process.env.TON_CENTER_API_KEY,
})

const fetchTxs = async ({
  address,
  toLt,
  lt,
  hash,
}: {
  address: string
  toLt?: string
  lt?: string
  hash?: string
}) => {
  if (address === '') {
    throw new Error('address is empty')
  }
  console.log(`address: ${address}, toLt: ${toLt}, lt: ${lt}, hash: ${hash}`)
  return await tonClient.getTransactions(Address.parse(address), {
    to_lt: toLt ? toLt : undefined,
    lt: lt ? lt : undefined,
    hash,
    limit: FETCH_LENGTH,
    archival: true,
  })
}

// fetch transactions (toLt, lt]
// to use 'lt', hash must be provided
const fetchTransactions = async ({
  contractAddress,
  toLt = '',
  baseLt,
  baseHash,
}: {
  contractAddress: string
  toLt?: string
  baseLt?: string
  baseHash?: string
}) => {
  let lt = baseLt || ''
  let hash = baseHash || ''
  const setLastFetchPoint = ({
    newLt,
    newHash,
  }: {
    newLt: string
    newHash: string
  }) => {
    lt = newLt
    hash = newHash
  }

  const transactions: TransactionWithHash[] = []

  for (;;) {
    try {
      const res = await fetchTxs({
        address: contractAddress,
        toLt,
        lt,
        hash,
      })
      const sorted = sortBy(res, (tx) => tx.lt, 'asc')
      const txs = map<Transaction, TransactionWithHash>(sorted, (tx) => {
        const hashBase64 = tx.hash().toString('base64') // base64 form -> used in toncenter transactions api
        const hexEncoding = tx.hash().toString('hex') // hex form -> used in tonapi trace api
        return {
          ...tx,
          hash: hashBase64,
          hashHex: hexEncoding,
        }
      })
      transactions.push(...txs)

      if (txs.length > 0) {
        console.log(`Fetched transactions (toLt: ${toLt} ~ lt: ${lt}]`)
      }

      // TON CENTER API limit is 100 txs per request.
      // If 100 txs are found, we need to fetch txs more precisely.
      if (txs.length >= FETCH_LENGTH) {
        lt = txs[0].lt.toString()
        hash = txs[0].hash
        setLastFetchPoint({ newLt: lt, newHash: hash })
        continue
      }
      break
    } catch (e: any) {
      const status = e.response?.status
      if (status === 429) {
        warn('Rate limit. Wait 3s')
        await sleep(3000)
        continue
      } else {
        error(
          `Error fetching transactions.  (toLt: ${toLt} ~ lt: ${lt}], hash: ${hash}`,
        )
        logError(e)
        return []
      }
    }
  }

  if (transactions.length === 0) {
    return []
  }

  const orderredTxs = sortBy(transactions, (e) => e.lt, 'asc')
  const uniq = uniqBy(orderredTxs, (e) => e.hash)
  return uniq
}

export default fetchTransactions
