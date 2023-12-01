import { Dictionary } from "@ton/core";

export interface Transaction {
  source: string; // pool address
  hash: string; // transaction hash
  timestamp: number; // timestamp
}

export interface Event<T> {
  transaction: Transaction;
  params: T;
}

export interface DepositedToBinsParams {
  senderAddress: string;
  receiverAddress: string;
  tokenAddress: string;
  deposited: Dictionary<number, { amount: bigint }>;
}
