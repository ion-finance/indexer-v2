import { Cell } from '@ton/core'

export interface Transaction {
  source: string // pool address
  hash: string // transaction hash
  timestamp: number // timestamp
  eventId: string // event id
}

export interface Event {
  transaction: Transaction
  body: Cell
}

export interface CachedEvent {
  event_id: string
  timestamp: number
  lt: number
}
