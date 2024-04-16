import updateTokenPricesLogic from 'src/api/routers/updateTokenPrices/updateTokenPricesLogic'
import {
  handleAddLiquidity,
  handleExchange,
  handlePoolCreated,
  handleRemoveLiquidity,
  // handleRemoveLiquidity,
} from 'src/mappings/cpmm'
import { Trace } from 'src/types/ton-api'

import extractPaths from './extractPaths'
import { CustomOP, OP } from './opCode'
import type { Ops } from './opCode'

// Info
// * This method can throw an error if the event is processing
const handleEvent = async (params: {
  routerAddress: string
  eventId: string
  traces: Trace
}) => {
  const { eventId, traces, routerAddress } = params
  // Extract paths
  const paths: Ops[][] = extractPaths(routerAddress, params.traces)
  // console.log("paths", paths);
  const checkPathHasOp = (paths: Ops[][], op: string) =>
    paths.some((path) =>
      path.some(
        ({ op: _op, customOp: _customOp }) => _op === op || _customOp === op,
      ),
    )

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
    console.log(`Router deploy event: ${eventId}`)
  }
  if (isPoolDeployed) {
    console.log(`Pool deploy event: ${eventId}`)
    await handlePoolCreated({ eventId, traces })
  }
  if (isLpWalletDeployed) {
    console.log(`LpWallet deploy event: ${eventId}`)
  }
  if (isLpAccountDeployed) {
    console.log(`LpAccount deploy event: ${eventId}`)
  }
  if (isRouterJettonWalletDeployed) {
    console.log(`Router Jetton Wallet deploy event: ${eventId}`)
  }

  if (isSwap) {
    console.log(`Exchange event: ${eventId}`)
    await handleExchange({ eventId, traces })
  } else if (isProvideLp) {
    console.log(`Provide Lp event: ${eventId}`)
  } else if (isProvideLpConfirmed) {
    console.log(`Provide Lp Confirmed: ${eventId}`)
    await handleAddLiquidity({ eventId, traces })
    await updateTokenPricesLogic()
  } else if (isRemoveLiquidity) {
    console.log(`Remove Liquidity event: ${eventId}`)
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
    console.log(`Unknown event: ${eventId}`)
    console.log('paths', paths)
  }
}

export default handleEvent
