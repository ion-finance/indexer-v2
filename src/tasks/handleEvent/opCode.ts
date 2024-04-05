// !NOTE: copy for referencing stonfi
// swap_refund_no_liq = 0x5ffe1295 = 1610486421
// swap_refund_reserve_err = 0x38976e9b = 949448347
// swap_ok_ref = 0x45078540 = 1158120768
// swap_ok = 0xc64370e5 = 3326308581
// burn_ok = 0xdda48b6a = 3718548330
// refund_ok = 0xde7dbbc2 = 3732782018
// export enum EXIT_CODE {
//   SWAP_REFUND_NO_LIQ = 1610486421,
//   SWAP_REFUND_RESERVE_ERR = 949448347,
//   SWAP_OK_REF = 1158120768,
//   SWAP_OK = 3326308581,
//   BURN_OK = 3718548330,
//   REFUND_OK = 3732782018,
// }

// swap_refund_no_liq = 0x5ffe1295 = 1610486421
// swap_refund_reserve_err = 0x38976e9b = 949448347
// swap_ok_ref = 0x45078540 = 1158120768
// swap_ok = 0xc64370e5 = 3326308581
// burn_ok = 0xdda48b6a = 3718548330
// refund_ok = 0xde7d

// SWAP = "0x25938561", // swap
// PROVIDE_LP = "0xfcf9e58f", //provide_lp
// ADD_LIQUIDITY = "0x3ebe5431", // add_liquidity
// CB_ADD_LIQUIDITY = "0x56dfeb8a", // cb_add_liquidity
// PAY_TO = "0xf93bb43f", // pay_tobbc2 = 3732782018

enum RAW_EXIT_CODE {
  SWAP_REFUND_NO_LIQ = "2019787373", // 0x7863826d
  SWAP_REFUND_RESERVE_ERR = "3533507941", // 0xd29d0d65
  SWAP_OK_REF = "2913750411", // 0xadac4d8b
  SWAP_OK = "595219051", //0x237a526b
  BURN_OK = "949856740", // 0x389da9e4
  REFUND_OK = "2921179866", // 0xae1daada
}

export enum RAW_OP {
  TRANSFER = "0x0f8a7ea5",
  TRANSFER_NOTIFICATION = "0x7362d09c",
  INTERNAL_TRANSFER = "0x178d4519",
  EXCESS = "0xd53276db",
  BURN = "0x595f07bc",
  BURN_NOTIFICATION = "0x7bdd97de",

  SWAP = "0x5b1234b8", // ion_swap
  PROVIDE_LP = "0xefe51dc8", // ion_provide_lp
  ADD_LIQUIDITY = "0x830ff89d", // ion_add_liquidity
  CB_ADD_LIQUIDITY = "0x38693fcc", // ion_cb_add_liquidity
  PAY_TO = "0x15a737f2", // ion_pay_to
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
export const EXIT_CODE = createBiDirectionalEnum(RAW_EXIT_CODE);
