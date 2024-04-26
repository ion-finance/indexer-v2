import axios from 'axios'

import { checkPathHasOp } from 'src/tasks/handleEvent'
import extractPaths from 'src/tasks/handleEvent/extractPaths'
import { CustomOP, OP, Ops } from 'src/tasks/handleEvent/opCode'
import { Trace } from 'src/types/ton-api'
import { getInput } from 'src/utils/userInput'

const testTransaction = async () => {
  const userInput = await getInput('Enter event id: ')
  console.log(`You entered: ${userInput}`)

  const routerAddress = process.env.ROUTER_ADDRESS || ''

  const trace = await (async function () {
    const res = await axios(`${process.env.TON_API_URL}/traces/${userInput}`, {
      headers: {
        Authorization: `Bearer ${process.env.TON_API_KEY}`,
      },
    })
    return res.data as Trace
  })()

  const paths: Ops[][] = extractPaths(routerAddress, trace)
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

  console.log('paths', paths)

  console.log(
    'isRouterDeployed, isPoolDeployed, isLpWalletDeployed, isLpAccountDeployed, isRouterJettonWalletDeployed, isSwap, isProvideLpConfirmed, isProvideLp, isRemoveLiquidity',
    isRouterDeployed,
    isPoolDeployed,
    isLpWalletDeployed,
    isLpAccountDeployed,
    isRouterJettonWalletDeployed,
    isSwap,
    isProvideLpConfirmed,
    isProvideLp,
    isRemoveLiquidity,
  )
}

testTransaction()
