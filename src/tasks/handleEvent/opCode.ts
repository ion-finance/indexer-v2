export enum RAW_OP {
  TRANSFER = "0x0f8a7ea5",
  TRANSFER_NOTIFICATION = "0x7362d09c",
  PROVIDE_LP = "0xfcf9e58f",
  PAY_TO = "0xf93bb43f",
  ADD_LIQUIDITY = "0x3ebe5431",
  CB_ADD_LIQUIDITY = "0x56dfeb8a",
  INTERNAL_TRANSFER = "0x178d4519",
  EXCESS = "0xd53276db",
  SWAP = "0x25938561",
}

export enum RAW_CUSTOM_OP {
  // custom ops
  EXT_IN_MSG = "ext_in_msg",
  ROUTER_DEPLOYED = "router_deployed",
  POOL_DEPLOYED = "pool_deployed",
  ROUTER_JETTON_WALLET_DEPLOYED = "router_jetton_wallet_deployed",
  LP_WALLET_DEPLOYED = "lp_wallet_deployed",
  LP_ACCOUNT_DEPLOYED = "lp_account_deployed",
}

export type Ops = {
  op: string;
  opReadable?: string;
  customOp: string;
};

// It makes bi-directional enum
// ex) OP[key] = value, OP[value] = key
function createBiDirectionalEnum<E extends { [index: string]: string }>(
  e: E
): E & { [key: string]: string } {
  const reverseEntries = Object.entries(e).map(([key, value]) => [value, key]);
  return Object.fromEntries([...Object.entries(e), ...reverseEntries]) as E & {
    [key: string]: string;
  };
}

export const OP = createBiDirectionalEnum(RAW_OP);
export const CustomOP = createBiDirectionalEnum(RAW_CUSTOM_OP);
