import { routerAddress } from 'src/constant/address'
import fetchTransactions from 'src/tasks/fetchTransactions'
import { parseTransaction } from 'src/transactions'
import { TransactionWithHash } from 'src/types/ton-center'

const lt = '46033289000001'
const hash = 'fPZLyOuZIY5GZp9FOkRejzpehudusNuKlQZvgI4/N5M='

// const lt= '46180709000001'
// const hash= 'c5uyIL6tECDh8fQ4noYWh+e5db8wDH8tt8SJ5PTtNhU='

// const lt= '46222594000001'
// const hash= 'vZzYTm7Dn1T4GbQbgTzvPnP0iNZZMcuzUahJwdbssbA='

// const lt= '46223856000003'
// const hash= 'v2ZY+rYWRGq1yAIDJU/r0grbwh4dKcCSFfyEygbmSGY='
const testFetchtransactions = async () => {
  const txs = await fetchTransactions({
    contractAddress: routerAddress,
    baseLt: lt,
    baseHash: hash,
  })

  const handleTxs = async (txs: TransactionWithHash[]) => {
    const run = async (originTxs: TransactionWithHash[]) => {
      const txs = [...originTxs]
      while (txs.length > 0) {
        const tx = txs.shift()
        if (!tx) {
          return { error: false, txsLeft: null }
        }
        const parsedTx = parseTransaction(tx)
        const { inMessage, outMessages, hash, hashHex, lt } = parsedTx
        console.log(
          `hashHex: ${hashHex}, lt: ${lt}, inMessage: ${inMessage}, outMessages[0]: ${outMessages?.[0]}`,
        )
      }
      return { error: false, txsLeft: null }
    }

    const { error, txsLeft } = await run(txs)
  }
  await handleTxs(txs)
}

testFetchtransactions()
