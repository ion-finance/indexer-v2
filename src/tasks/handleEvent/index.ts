import { updateTokenPrices } from 'src/common/updateTokenPrices'
import {
  handleAddLiquidity,
  handleExchange,
  handlePoolCreated,
  handleRemoveLiquidity,
} from 'src/mappings/cpmm'
import { Trace } from 'src/types/ton-api'

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
  // console.log("paths", paths);
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
    console.log(`${eventCount}. Router deployed: ${eventId}`)
  }
  if (isPoolDeployed) {
    console.log(`${eventCount}. Pool deployed: ${eventId}`)
    await handlePoolCreated({ eventId, traces })
  }
  if (isLpWalletDeployed) {
    console.log(`${eventCount}. LpWallet deployed: ${eventId}`)
  }
  if (isLpAccountDeployed) {
    console.log(`${eventCount}. LpAccount deployed: ${eventId}`)
  }
  if (isRouterJettonWalletDeployed) {
    console.log(`${eventCount}. Router Jetton Wallet deployed: ${eventId}`)
  }

  if (isSwap) {
    console.log(`${eventCount}. Exchange: ${eventId}`)
    await handleExchange({ eventId, traces })

    const utime = traces.transaction.utime
    await updateTokenPrices(utime * 1000)
  } else if (isProvideLp) {
    console.log(`${eventCount}. Provide Lp: ${eventId}`)
  } else if (isProvideLpConfirmed) {
    console.log(`${eventCount}. Provide Lp Confirmed: ${eventId}`)
    await handleAddLiquidity({ eventId, traces })

    const utime = traces.transaction.utime
    await updateTokenPrices(utime * 1000)
  } else if (isRemoveLiquidity) {
    console.log(`${eventCount}. Remove Liquidity: ${eventId}`)
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
    console.log(`${eventCount}. Unknown event: ${eventId}`)
    console.log('paths', paths)
  }
  eventCount++
}

export default handleEvent
