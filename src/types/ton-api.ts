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
  utime: number;
  out_msgs: OutMessage[];
  in_msg: InMsg;
  orig_status: string;
  end_status: string;
  // others..
}

interface InMsg {
  msg_type: string;
  op_code?: string;
  source: {
    address: string;
  };
  destination: {
    address: string;
  };
  // TODO: fill others..
}
export interface TransactionResult {
  transaction: Transaction;
  interfaces?: string[];
  children?: TransactionResult[];
}

export interface Event {
  event_id: string;
  account: Account;
  timestamp: number;
  is_scam: boolean;
  lt: number;
  in_progress: boolean;
  extra: number;
}

// from ton-api
// https://tonapi.io/api-v2
export interface AccountEvents {
  events: AccountEvent[];
  next_from: number;
}
export interface AccountEvent {
  event_id: string;
  account: AccountAddress;
  timestamp: number;
  actions: Action[];
  is_scam: boolean;
  lt: number;
  in_progress: boolean;
  extra: number;
}

export interface AccountAddress {
  address: string;
  name?: string;
  is_scam: boolean;
  icon?: string;
  is_wallet: boolean;
}
export interface Action {
  type: ActionType;
  status: string;
  simple_preview: ActionSimplePreview;

  // TODO: add other action types
  TonTransfer?: TonTransferAction;
  JettonTransfer?: JettonTransferAction;
  JettonSwap?: JettonSwapAction;
}

export interface TonTransferAction {
  sender: AccountAddress;
  recipient: AccountAddress;
  amount: number;
  comment?: string;
  encrypted_comment?: EncryptedComment;
  refund?: Refund;
}
export interface JettonTransferAction {
  sender?: AccountAddress;
  recipient?: AccountAddress;
  senders_wallet: string;
  recipients_wallet: string;
  amount: string;
  comment?: string;
  encrypted_comment?: EncryptedComment;
  refund?: Refund;
  jetton: JettonPreview;
}

export interface JettonSwapAction {
  dex: DEX;
  amount_in: string;
  amount_out: string;
  ton_in?: number;
  ton_out?: number;
  user_wallet: AccountAddress;
  router: AccountAddress;
  jetton_master_in?: JettonPreview;
  jetton_master_out?: JettonPreview;
}
type DEX = "stonfi" | "tonswap" | "tonbridge";
export interface JettonPreview {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  image: string;
  verification: JettonVerificationTypestringEnum;
}
type JettonVerificationTypestringEnum = "whitelist" | "blacklist" | "none";

export interface EncryptedComment {
  encryption_type: string;
  cipher_text: string;
}
export interface Refund {
  type: string;
  origin: string;
}

interface ActionSimplePreview {
  name: string;
  description: string;
  action_image?: string;
  value?: string;
  value_image?: string;
  accounts: AccountAddress[];
}

type ActionType =
  | "TonTransfer"
  | "JettonTransfer"
  | "JettonBurn"
  | "JettonMint"
  | "NftItemTransfer"
  | "ContractDeploy"
  | "Subscribe"
  | "UnSubscribe"
  | "AuctionBid"
  | "NftPurchase"
  | "DepositStake"
  | "WithdrawStake"
  | "WithdrawStakeRequest"
  | "JettonSwap"
  | "SmartContractExec"
  | "ElectionsRecoverStake"
  | "ElectionsDepositStake"
  | "DomainRenew"
  | "InscriptionTransfer"
  | "InscriptionMint"
  | "Unknown";
