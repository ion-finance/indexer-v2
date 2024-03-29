import axios from "axios";
import { AccountEvent, ActionType, Trace } from "../../types/ton-api";

import {
  handleAddLiquidity,
  handleExchange,
  handlePoolCreated,
  handleRemoveLiquidity,
} from "../../mappings/cpmm";
import { parseRaw } from "../../utils/address";
import { Address } from "@ton/core";
import extractPaths from "./extractPaths";
import { CustomOP, OP } from "./opCode";
import type { Ops } from "./opCode";

// Info
// * This method can throw an error if the event is processing
const handleEvent = async (event: AccountEvent) => {
  const { event_id, actions } = event;
  const res = await axios(`${process.env.TON_API_URL}/traces/${event_id}`, {
    headers: {
      Authorization: `Bearer ${process.env.TON_API_KEY}`,
    },
  });

  const firstActionType = actions[0].type;
  const isSwap = firstActionType === ActionType.JETTON_SWAP;

  const traces = res.data as Trace;

  // Extract paths
  // TODO: implement test code
  const paths: Ops[][] = extractPaths(traces);
  // console.log("paths", paths);
  const checkPathHasOp = (paths: Ops[][], op: string) =>
    paths.some((path) =>
      path.some(
        ({ op: _op, customOp: _customOp }) => _op === op || _customOp === op
      )
    );

  const isRouterDeployed = checkPathHasOp(paths, CustomOP.ROUTER_DEPLOYED);
  const isPoolDeployed = checkPathHasOp(paths, CustomOP.POOL_DEPLOYED);
  const isLpWalletDeployed = checkPathHasOp(paths, CustomOP.LP_WALLET_DEPLOYED);
  const isLpAccountDeployed = checkPathHasOp(
    paths,
    CustomOP.LP_ACCOUNT_DEPLOYED
  );
  const isRouterJettonWalletDeployed = checkPathHasOp(
    paths,
    CustomOP.ROUTER_JETTON_WALLET_DEPLOYED
  );

  const isProvideLpConfirmed = checkPathHasOp(paths, OP.CB_ADD_LIQUIDITY);

  const isProvideLp =
    !isProvideLpConfirmed && checkPathHasOp(paths, OP.ADD_LIQUIDITY);

  // deploy cases can be overlapped
  if (isRouterDeployed) {
    console.log(`Router deploy event: ${event_id}`);
  }
  if (isPoolDeployed) {
    console.log(`Pool deploy event: ${event_id}`);
    await handlePoolCreated({ event, traces });
  }
  if (isLpWalletDeployed) {
    console.log(`LpWallet deploy event: ${event_id}`);
  }
  if (isLpAccountDeployed) {
    console.log(`LpAccount deploy event: ${event_id}`);
  }
  if (isRouterJettonWalletDeployed) {
    console.log(`Router Jetton Wallet deploy event: ${event_id}`);
  }

  if (isSwap) {
    console.log(`Exchange event: ${event_id}`);
    await handleExchange({ event, traces });
  } else if (isProvideLp) {
    console.log(`Provide Lp event: ${event_id}`);
  } else if (isProvideLpConfirmed) {
    console.log(`Provide Lp Confirmed: ${event_id}`);
    await handleAddLiquidity({ event, traces });
  }

  if (
    !isRouterDeployed &&
    !isPoolDeployed &&
    !isLpWalletDeployed &&
    !isLpAccountDeployed &&
    !isRouterJettonWalletDeployed &&
    !isSwap &&
    !isProvideLp &&
    !isProvideLpConfirmed
  ) {
    console.log(`Unknown event: ${event_id}`);
    console.log("paths", paths);
  }
};

export default handleEvent;
