import axios from "axios";
import { TransactionResult } from "../types/ton-api";
import { Address, Cell } from "@ton/core";
import handleDepositedToBins from "../mappings/handleDepositedToBins";
import handleInitialized from "../mappings/handleInitialized";
import handleSwap from "../mappings/handleSwap";
import handleTransferBatch from "../mappings/handleTransferBatch";
import handleWithdrawnFromBins from "../mappings/handleWithdrawnFromBins";
import handleOrderPlaced from "../mappings/handleOrderPlaced";
import handleOrderCancelled from "../mappings/handleOrderCancelled";
import handleOrderClaimed from "../mappings/handleOrderClaimed";
import handleOrderExecuted from "../mappings/handleOrderExecuted";

const DEPOSITED_TO_BINS = "0xafeb11ef";
const INITIALIZED = "0x9bb3a52e";
const SWAP = "0x25938561";
const TRANSFER_BATCH = "0x5b8fa78c";
const WITHDRAWN_FROM_BINS = "0xf6172b31";
const ORDER_PLACED = "0xbef3f947";
const ORDER_CANCELLED = "0x4572803f";
const ORDER_EXECUTED = "0x18b134be";
const ORDER_CLAIMED = "0x5e586bc8";

const handleEvent = async (event_id: string) => {
  // TODO : handle errors;
  // ! FIXME
  // * traces api response can be pending

  let transactionRes: TransactionResult | undefined;

  try {
    const res = await axios(`${process.env.TON_API_URL}/traces/${event_id}`, {
      headers: {
        Authorization: `Bearer ${process.env.TON_API_KEY}`,
      },
    });

    transactionRes = res.data as TransactionResult;
  } catch (e) {
    console.log("Fetch trace error");
  }

  if (!transactionRes) {
    return;
  }

  let txs = [transactionRes];
  const txsHasOutMsgs: TransactionResult[] = [];
  while (txs.length != 0) {
    let new_txs: TransactionResult[] = [];

    txs.forEach((t) => {
      if (t.transaction.out_msgs.length > 0) {
        txsHasOutMsgs.push({
          ...t,
          children: undefined,
        });
      }

      if (t.children) {
        new_txs = [...new_txs, ...t.children];
      }
    });

    txs = new_txs;
  }

  for (let i = 0; i < txsHasOutMsgs.length; i++) {
    const tx = txsHasOutMsgs[i];
    for (let j = 0; j < tx.transaction.out_msgs.length; j++) {
      const msg = tx.transaction.out_msgs[j];
      const body = Cell.fromBoc(Buffer.from(msg.raw_body, "hex"))[0];
      const transaction = {
        source: Address.parseRaw(tx.transaction.account.address).toString(),
        hash: tx.transaction.hash,
        timestamp: tx.transaction.utime,
      };

      switch (msg.op_code) {
        case DEPOSITED_TO_BINS: {
          await handleDepositedToBins({
            transaction,
            body,
          });
          break;
        }
        case INITIALIZED: {
          await handleInitialized({
            transaction,
            body,
          });
          break;
        }
        case SWAP: {
          await handleSwap({
            transaction,
            body,
          });
          break;
        }
        case TRANSFER_BATCH: {
          await handleTransferBatch({
            transaction,
            body,
          });
          break;
        }
        case WITHDRAWN_FROM_BINS: {
          await handleWithdrawnFromBins({
            transaction,
            body,
          });
          break;
        }
        case ORDER_PLACED: {
          await handleOrderPlaced({
            transaction,
            body,
          });
          break;
        }
        case ORDER_CANCELLED: {
          await handleOrderCancelled({
            transaction,
            body,
          });
          break;
        }
        case ORDER_CLAIMED: {
          await handleOrderClaimed({
            transaction,
            body,
          });
          break;
        }
        case ORDER_EXECUTED: {
          await handleOrderExecuted({
            transaction,
            body,
          });
          break;
        }
        default:
          console.log("UNKNOWN");
          break;
      }
    }
  }
};

export default handleEvent;
