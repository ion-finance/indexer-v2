import { updateTokenPrices } from 'src/common/updateTokenPrices'
import {
  handleAddLiquidity,
  handleExchange,
  handlePoolCreated,
  handleRemoveLiquidity,
} from 'src/mappings/cpmm'
import { Trace } from 'src/types/ton-api'
import { info, warn } from 'src/utils/log'

import extractPaths from './extractPaths'
import { CustomOP, OP } from './opCode'
import type { Ops } from './opCode'

export const checkPathHasOp = (paths: Ops[][], op: string) =>
  paths.some((path) =>
    path.some(
      ({ op: _op, customOp: _customOp }) => _op === op || _customOp === op,
    ),
  )

// Info
// * This method can throw an error if the event is processing
let eventCount = 1
const handleEvent = async (params: {
  routerAddress: string
  eventId: string
  traces: Trace
}) => {
  const { eventId, traces, routerAddress } = params

  // Extract paths
  const paths: Ops[][] = extractPaths(routerAddress, params.traces)
  // info("paths", paths);
  const isRouterDeployed = checkPathHasOp(paths, CustomOP.ROUTER_DEPLOYED)
  const isPoolDeployed = checkPathHasOp(paths, CustomOP.POOL_DEPLOYED)
  const isLpWalletDeployed = checkPathHasOp(paths, CustomOP.LP_WALLET_DEPLOYED)
  const isLpAccountDeployed = checkPathHasOp(
    paths,
    CustomOP.LP_ACCOUNT_DEPLOYED,
  )
  const isRouterJettonWalletDeployed = checkPathHasOp(
    paths,
    CustomOP.ROUTER_JETTON_WALLET_DEPLOYED,
  )

  const isSwap = checkPathHasOp(paths, OP.SWAP)
  const isProvideLpConfirmed = checkPathHasOp(paths, OP.CB_ADD_LIQUIDITY)

  const isProvideLp =
    !isProvideLpConfirmed && checkPathHasOp(paths, OP.ADD_LIQUIDITY)

  const isRemoveLiquidity = checkPathHasOp(paths, OP.BURN_NOTIFICATION)

  // deploy cases can be overlapped
  if (isRouterDeployed) {
    info(`${eventCount}. Router deployed: ${eventId}`)
  }
  if (isPoolDeployed) {
    info(`${eventCount}. Pool deployed: ${eventId}`)
    await handlePoolCreated({ eventId, traces })
  }
  if (isLpWalletDeployed) {
    info(`${eventCount}. LpWallet deployed: ${eventId}`)
  }
  if (isLpAccountDeployed) {
    info(`${eventCount}. LpAccount deployed: ${eventId}`)
  }
  if (isRouterJettonWalletDeployed) {
    info(`${eventCount}. Router Jetton Wallet deployed: ${eventId}`)
  }

  if (isSwap) {
    info(`${eventCount}. Exchange: ${eventId}`)
    await handleExchange({ eventId, traces })

    const utime = traces.transaction.utime
    await updateTokenPrices(utime * 1000)
  } else if (isProvideLp) {
    info(`${eventCount}. Provide Lp: ${eventId}`)
  } else if (isProvideLpConfirmed) {
    info(`${eventCount}. Provide Lp Confirmed: ${eventId}`)
    await handleAddLiquidity({ eventId, traces })

    const utime = traces.transaction.utime
    await updateTokenPrices(utime * 1000)
  } else if (isRemoveLiquidity) {
    info(`${eventCount}. Remove Liquidity: ${eventId}`)
    await handleRemoveLiquidity({ eventId, traces })
  }

  if (
    !isRouterDeployed &&
    !isPoolDeployed &&
    !isLpWalletDeployed &&
    !isLpAccountDeployed &&
    !isRouterJettonWalletDeployed &&
    !isSwap &&
    !isProvideLp &&
    !isProvideLpConfirmed &&
    !isRemoveLiquidity
  ) {
    handleUnknownEvent(eventCount, eventId, paths)
  }
  eventCount++
}

export default handleEvent

const alreadyCheckedEvents = [
  '5084cd2797b2416b39f623b93934e219272e529abeca49cc12a7146ff996a026',
  'e053a3459b2205466ae24f5aa46eb035eb9b907b6d86b520aee598e371750171',
  'c61587696903627bc99d05b05a8837ebf134969814c0270fe7eb11fc206c364e',
]
const handleUnknownEvent = (
  eventCount: number,
  eventId: string,
  paths: Ops[][],
) => {
  const isAlreadyChecked = alreadyCheckedEvents.includes(eventId)
  if (isAlreadyChecked) {
    info(`${eventCount}. Already checked event: ${eventId}`)
    return
  }
  const hasNFTTransfer = checkPathHasOp(paths, OP.NFT_TRANSFER)
  if (hasNFTTransfer) {
    info(`${eventCount}. NFT Transfer event: ${eventId}`)
    return
  }
  const hasTextComment = checkPathHasOp(paths, OP.TEXT_COMMENT)
  if (hasTextComment) {
    info(`${eventCount}. Text Comment event: ${eventId}`)
    return
  }

  info(`${eventCount}. Unknown event: ${eventId}`)
  info('paths', paths)
}
