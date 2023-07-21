export interface Transaction {
  from: string; // pool address
  hash: string; // transaction hash
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
export interface ExchangeEvent {
  transaction: Transaction;
  from: string;
  i: number;
  j: number;
  amountI: bigint;
  amountJ: bigint;
  to: string;
}

/*
  const body = message.body.beginParse();
  const log_code = body.loadUint(32);
  const from_address = body.loadAddress();
  const amount_builder = body.loadRef().beginParse();
  const amounts: bigint[] = [];
*/
export interface BurnEvent {
  transaction: Transaction;
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
export interface MintEvent {
  transaction: Transaction;
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
export interface PoolCreatedEvent {
  transaction: Transaction;
  poolType: number;
  poolAddress: string;
  coins: string[];
}
