import dotenv from 'dotenv'
dotenv.config()

enum RAW_EXIT_CODE_STONFI {
  SWAP_REFUND_NO_LIQ = '1610486421', // 0x5ffe1295
  SWAP_REFUND_RESERVE_ERR = '949448347', // 0x38976e9b
  SWAP_OK_REF = '1158120768', // 0x45078540
  SWAP_OK = '3326308581', // 0xc64370e5
  BURN_OK = '3718548330', // 0xdda48b6a
  REFUND_OK = '3732782018', // 0xde7dbbc2
}

enum RAW_OP_STONFI {
  TRANSFER = '0x0f8a7ea5',
  TRANSFER_NOTIFICATION = '0x7362d09c',
  INTERNAL_TRANSFER = '0x178d4519',
  EXCESS = '0xd53276db',
  BURN = '0x595f07bc',
  BURN_NOTIFICATION = '0x7bdd97de',

  REFUND_ME = '0x0bf3f447',
  CB_REFUND_ME = '0x89446a42',

  BOUNCE = '0xffffffff',
  TEXT_COMMENT = '0x00000000',
  EXCEPTION = 'exception',

  SWAP = '0x25938561', // swap
  PROVIDE_LP = '0xfcf9e58f', //provide_lp
  ADD_LIQUIDITY = '0x3ebe5431', // add_liquidity
  CB_ADD_LIQUIDITY = '0x56dfeb8a', // cb_add_liquidity
  PAY_TO = '0xf93bb43f', // pay_to = 3732782018

  COLLECT_FEES = '0x1fcb7d3d',
  SET_FEES = '0x355423e5',
  RESET_GAS = '0x42a0fb43',
  RESET_POOL_GAS = '0xf6aa9737',
  LOCK = '0x878f9b0e',
  UNLOCK = '0x6ae4b0ef',

  INIT_CODE_UPGRADE = '0xdf1e233d',
  INIT_ADMIN_UPGRADE = '0x2fb94384',
  CANCEL_CODE_UPGRADE = '0x357ccc67',
  CANCEL_ADMIN_UPGRADE = '0xa4ed9981',
  FINALIZE_UPGRADES = '0x6378509f',

  GETTER_POOL_ADDRESS = '0xd1db969b',
  TRANSFER_BOUNCE_LOCKED = '0xa0dbdcb',
  TRANSFER_BOUNCE_INVALID_REQUEST = '0x19727ea7',
}
enum RAW_EXIT_CODE {
  // prefix 'ion_'
  SWAP_REFUND_NO_LIQ = '2019787373', // 0x7863826d
  SWAP_REFUND_RESERVE_ERR = '3533507941', // 0xd29d0d65
  SWAP_OK_REF = '2913750411', // 0xadac4d8b
  SWAP_OK = '595219051', //0x237a526b
  BURN_OK = '949856740', // 0x389da9e4
  REFUND_OK = '2921179866', // 0xae1daada
}

enum RAW_OP {
  TRANSFER = '0x0f8a7ea5',
  TRANSFER_NOTIFICATION = '0x7362d09c',
  INTERNAL_TRANSFER = '0x178d4519',
  EXCESS = '0xd53276db',
  BURN = '0x595f07bc',
  BURN_NOTIFICATION = '0x7bdd97de',

  REFUND_ME = '0x0bf3f447',
  CB_REFUND_ME = '0x89446a42',

  BOUNCE = '0xffffffff',
  TEXT_COMMENT = '0x00000000',
  EXCEPTION = 'exception',

  SWAP = '0x5b1234b8', // ion_swap
  PROVIDE_LP = '0xefe51dc8', // ion_provide_lp
  ADD_LIQUIDITY = '0x830ff89d', // ion_add_liquidity
  CB_ADD_LIQUIDITY = '0x38693fcc', // ion_cb_add_liquidity
  PAY_TO = '0x15a737f2', // ion_pay_to
}

export enum RAW_CUSTOM_OP {
  // custom ops
  EXT_IN_MSG = 'ext_in_msg',
  ROUTER_DEPLOYED = 'router_deployed',
  POOL_DEPLOYED = 'pool_deployed',
  ROUTER_JETTON_WALLET_DEPLOYED = 'router_jetton_wallet_deployed',
  LP_WALLET_DEPLOYED = 'lp_wallet_deployed',
  LP_ACCOUNT_DEPLOYED = 'lp_account_deployed',
}

export type Ops = {
  op: string
  opReadable?: string
  customOp: string
}

// It makes bi-directional enum
// ex) OP[key] = value, OP[value] = key
function createBiDirectionalEnum<E extends { [index: string]: string }>(
  e: E,
): E & { [key: string]: string } {
  const reverseEntries = Object.entries(e).map(([key, value]) => [value, key])
  return Object.fromEntries([...Object.entries(e), ...reverseEntries]) as E & {
    [key: string]: string
  }
}

const isStonfi = process.env.IS_STONFI === 'true'
const op = isStonfi ? RAW_OP_STONFI : RAW_OP
const exitCode = isStonfi ? RAW_EXIT_CODE_STONFI : RAW_EXIT_CODE

export const OP = createBiDirectionalEnum(op)
export const CustomOP = createBiDirectionalEnum(RAW_CUSTOM_OP)
export const EXIT_CODE = createBiDirectionalEnum(exitCode)
