const MAINNET_TON_WALLET_ADDRESS =
  'EQCpTiANFaLwWiLphbo_FD7VXsfMf-aNjSpALJ4vQHbFiZm5'
export const isMainnet =
  process.env.TON_WALLET_ADDRESS === MAINNET_TON_WALLET_ADDRESS
export const isCLMM = process.env.IS_CLMM === 'true'
export const PORT = process.env.PORT || 3000
export const MIN_POOL = 2000 // 2s
