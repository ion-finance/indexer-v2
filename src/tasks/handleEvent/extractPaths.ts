import { Address } from "@ton/core";
import { Trace } from "../../types/ton-api";
import { parseRaw } from "../../utils/address";
import dotenv from "dotenv";
import { CustomOP, OP, Ops } from "./opCode";
import { routerAddress } from "../../address";
dotenv.config();

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
          Address.parse(destinationAddress).equals(Address.parse(routerAddress))
        ) {
          return CustomOP.ROUTER_DEPLOYED;
        } else if (
          Address.parse(sourceAddress).equals(Address.parse(routerAddress))
        ) {
          return CustomOP.POOL_DEPLOYED;
        } else if (isParentJettonMaster) {
          // parent should be jettonMaster && pool
          if (opCode === OP.ADD_LIQUIDITY) {
            return CustomOP.LP_ACCOUNT_DEPLOYED;
          } else {
            return CustomOP.LP_WALLET_DEPLOYED;
          }
        } else if (opCode === OP.INTERNAL_TRANSFER) {
          return CustomOP.ROUTER_JETTON_WALLET_DEPLOYED;
        } else {
          console.warn("Unknown deploy case", transaction.hash);
        }
      }
      return "";
    })();

    const opKey = OP[opCode];
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

export default extractPaths;
