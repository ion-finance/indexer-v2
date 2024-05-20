import { Transaction } from '@ton/ton'
export type TransactionWithHash = Omit<Transaction, 'hash'> & {
  hash: string
  hashHex: string
}

export interface TxCache {
  hash: string
  hashHex: string
  lt: number
}
