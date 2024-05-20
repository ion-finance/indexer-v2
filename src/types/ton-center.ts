import { AccountStatus, CommonMessageInfo, Transaction } from '@ton/ton'
export type TransactionWithHash = Omit<Transaction, 'hash'> & {
  hash: string
  hashHex: string
}

type ParsedMessage = {
  op: string
  opHex: string
  queryId: number
  info: {
    src?: string
    dest?: string
  } | null
  msg: string
}
export type ParsedTransaction = {
  hash: string
  lt: number
  now: number
  hashHex: string
  inMessage: ParsedMessage | null
  outMessages: ParsedMessage[] | null
  firstOutMessage: ParsedMessage | null
  oldStatus: AccountStatus
  endStatus: AccountStatus
}

export interface TxCache {
  hash: string
  hashHex: string
  lt: number
}
