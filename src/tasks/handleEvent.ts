import axios from "axios";
import { AccountEvent, ActionType, Trace } from "../types/ton-api";

import {
  handleAddLiquidity,
  handleExchange,
  handlePoolCreated,
  handleRemoveLiquidity,
} from "../mappings/cpmm";
import { parseRaw } from "../utils/address";
import dotenv from "dotenv";
import { Address } from "@ton/core";
dotenv.config();
const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS || "";

enum OP {
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

enum CUSTOM_OP {
  // custom ops
  EXT_IN_MSG = "ext_in_msg",
  ROUTER_DEPLOYED = "router_deployed",
  POOL_DEPLOYED = "pool_deployed",
  ROUTER_JETTON_WALLET_DEPLOYED = "router_jetton_wallet_deployed",
  LP_WALLET_DEPLOYED = "lp_wallet_deployed",
  LP_ACCOUNT_DEPLOYED = "lp_account_deployed",
}
function createBiDirectionalEnum<E extends { [index: string]: string }>(
  e: E
): E & { [key: string]: string } {
  const reverseEntries = Object.entries(e).map(([key, value]) => [value, key]);
  return Object.fromEntries([...Object.entries(e), ...reverseEntries]) as E & {
    [key: string]: string;
  };
}

export const BiDirectionalOP = createBiDirectionalEnum(OP);
export const BiDirectionalCustomOP = createBiDirectionalEnum(CUSTOM_OP);

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
  const isRouterDeployed = paths.some((path) =>
    path.some(
      ({ customOp }) => customOp === BiDirectionalCustomOP.ROUTER_DEPLOYED
    )
  );

  const isPoolDeployed = paths.some((path) =>
    path.some(
      ({ customOp }) => customOp === BiDirectionalCustomOP.POOL_DEPLOYED
    )
  );

  const isLpWalletDeployed = paths.some((path) =>
    path.some(
      ({ customOp }) => customOp === BiDirectionalCustomOP.LP_WALLET_DEPLOYED
    )
  );

  const isLpAccountDeployed = paths.some((path) =>
    path.some(
      ({ customOp }) => customOp === BiDirectionalCustomOP.LP_ACCOUNT_DEPLOYED
    )
  );

  const isRouterJettonWalletDeployed = paths.some((path) =>
    path.some(
      ({ customOp }) =>
        customOp === BiDirectionalCustomOP.ROUTER_JETTON_WALLET_DEPLOYED
    )
  );

  const isProvideLpConfirmed = paths.some((path) =>
    path.some(({ op }) => op === BiDirectionalOP.CB_ADD_LIQUIDITY)
  );

  const isProvideLp =
    !isProvideLpConfirmed &&
    paths.some((path) =>
      path.some(({ op }) => op === BiDirectionalOP.ADD_LIQUIDITY)
    );

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
  }
};

export default handleEvent;

// function extractPaths(node: Trace): string[][] {
function extractPaths(node: Trace): Ops[][] {
  // This function recursively extracts the paths using the spread operator.
  function recurse(
    currentNode: Trace,
    parentNode: Trace | null,
    path: Ops[],
    isFirst?: boolean
  ): void {
    // If there's no op_code in the in_msg, use 'ext_in_msg' as op_code for the root transaction.
    const { transaction } = currentNode;
    if (!transaction?.in_msg) {
      return;
    }
    const opCode = transaction.in_msg.op_code || "";
    const customOp = (function () {
      if (isFirst) {
        return "ext_in_msg";
      }
      const isParentJettonMaster =
        parentNode?.interfaces?.includes("jetton_master");
      const { orig_status, end_status } = transaction;
      if (orig_status === "nonexist" && end_status === "active") {
        const sourceAddress = parseRaw(transaction.in_msg.source?.address);
        const destinationAddress = parseRaw(
          transaction.in_msg?.destination?.address
        );
        // TODO: consider case of router jetton wallet deploy
        if (
          Address.parse(destinationAddress).equals(
            Address.parse(ROUTER_ADDRESS)
          )
        ) {
          return "router_deployed";
        } else if (
          Address.parse(sourceAddress).equals(Address.parse(ROUTER_ADDRESS))
        ) {
          return "pool_deployed";
        } else if (isParentJettonMaster) {
          // parent should be jettonMaster && pool
          if (opCode === BiDirectionalOP.ADD_LIQUIDITY) {
            return "lp_account_deployed";
          } else {
            return "lp_wallet_deployed";
          }
        } else if (opCode === BiDirectionalOP.INTERNAL_TRANSFER) {
          return "router_jetton_wallet_deployed";
        } else {
          return "contract_deployed";
        }
      }
      return "";
    })();

    const opKey = BiDirectionalOP[opCode];
    if (!opKey && !customOp) {
      console.warn(
        `Unknown opCode: ${opCode}, txHash: ${currentNode.transaction.hash}`
      );
    }
    // If currentNode does not have children, it is a leaf.
    if (!currentNode.children || currentNode.children.length === 0) {
      paths.push([
        ...path,
        {
          op: opCode,
          opReadable: opKey,
          customOp,
        },
      ]); // Use spread operator here
      return;
    }
    // If currentNode has children, iterate through them and recurse.
    currentNode.children.forEach((child) => {
      recurse(child, currentNode, [
        ...path,
        {
          op: opCode,
          opReadable: opKey,
          customOp,
        },
      ]); // Use spread operator here
    });
  }

  const paths: Ops[][] = [];
  // Start recursion with the root node.
  recurse(node, null, [], true);
  return paths;
}

type Ops = {
  op: string;
  opReadable?: string;
  customOp: string;
};
