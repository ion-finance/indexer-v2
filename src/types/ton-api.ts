export interface Account {
  address: string;
  is_scam: boolean;
}

export interface OutMessage {
  created_lt: number;
  ihr_disabled: boolean;
  bounce: boolean;
  bounced: boolean;
  value: number;
  fwd_fee: number;
  ihr_fee: number;
  source: Account;
  import_fee: number;
  created_at: number;
  op_code: string;
  raw_body: string;
}

export interface Transaction {
  hash: string;
  lt: string;
  account: Account;
  success: boolean;
  uptime: number;
  out_msgs: OutMessage[];
  // others.
}

export interface TransactionResult {
  transaction: Transaction;
  children?: TransactionResult[];
}
