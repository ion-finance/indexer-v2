import { Transaction } from '@ton/ton'
export type TransactionWithHash = Omit<Transaction, 'hash'> & {
  hash: string
  hashHex: string
}
