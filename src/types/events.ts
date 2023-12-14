import { Cell } from "@ton/core";

export interface Transaction {
  source: string; // pool address
  hash: string; // transaction hash
  timestamp: number; // timestamp
}

export interface Event {
  transaction: Transaction;
  body: Cell;
}
