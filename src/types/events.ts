export interface Transaction {
  source: string; // pool address
  hash: string; // transaction hash
  timestamp: number; // timestamp
}

export interface Event<T> {
  transaction: Transaction;
  params: T;
}

/*
  const body = message.body.beginParse();
  const log_code = body.loadUint(32);
  const from_address = body.loadAddress();
  const i = body.loadUint(2);
  const j = body.loadUint(2);
  const dx = body.loadCoins();
  const dy = body.loadCoins();
  const to_address = body.loadAddress();
*/
export interface ExchangeParams {
  from: string;
  i: number;
  j: number;
  amountI: string;
  amountJ: string;
  to: string;
}

/*
  const body = message.body.beginParse();
  const log_code = body.loadUint(32);
  const from_address = body.loadAddress();
  const amount_builder = body.loadRef().beginParse();
  const amounts: bigint[] = [];
*/
export interface BurnParams {
  from: string;
  amounts: string[];
}

/*
  const body = message.body.beginParse();
  const log_code = body.loadUint(32);
  const from_address = body.loadAddress();
  const amount_builder = body.loadRef().beginParse();
  const amounts: bigint[] = [];
*/
export interface MintParams {
  from: string;
  amounts: string[];
}

/*
  const body = message.body.beginParse();
  const log_code = body.loadUint(32);
  const pool_type = body.loadUint(4);
  const pool_address = body.loadAddress();
  const coins_builder = body.loadRef().beginParse();
  const coins: Address[] = [];
*/
export interface PoolCreatedParams {
  poolType: number;
  poolAddress: string;
  coins: string[];
}
