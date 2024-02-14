import axios from "axios";
import { TransactionResult } from "../types/ton-api";
import { Address, Cell } from "@ton/core";
import {
  handleDepositedToBins,
  handleInitialized,
  handleSwap,
  handleTransferBatch,
  handleWithdrawnFromBins,
  handleOrderPlaced,
  handleOrderCancelled,
  handleOrderClaimed,
  handleOrderExecuted,
} from "../mappings/clmm";
import {
  handleAddLiquidity,
  handleExchange,
  handlePoolCreated,
  handleRemoveLiquidity,
} from "../mappings/cpmm";

// CLMM
const DEPOSITED_TO_BINS = "0xafeb11ef";
const INITIALIZED = "0x9bb3a52e";
const SWAP = "0x25938561";
const TRANSFER_BATCH = "0x5b8fa78c";
const WITHDRAWN_FROM_BINS = "0xf6172b31";
const ORDER_PLACED = "0xbef3f947";
const ORDER_CANCELLED = "0x4572803f";
const ORDER_EXECUTED = "0x18b134be";
const ORDER_CLAIMED = "0x5e586bc8";

// CPMM
const ADD_LIQUIDITY = "0x01d3037e";
const REMOVE_LIQUIDITY = "0xa95d7721";
const EXCHANGE = "0xbd687ba6";
const POOL_CREATED = "0x7d0e1322";

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
        eventId: event_id,
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
          // !NOTE: disable withdraw on version pre-alpha-contract
          // await handleWithdrawnFromBins({
          //   transaction,
          //   body,
          // });
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
        case ADD_LIQUIDITY: {
          await handleAddLiquidity({
            transaction,
            body,
          });
          break;
        }
        case REMOVE_LIQUIDITY: {
          await handleRemoveLiquidity({
            transaction,
            body,
          });
          break;
        }
        case EXCHANGE: {
          await handleExchange({
            transaction,
            body,
          });
          break;
        }
        case POOL_CREATED: {
          await handlePoolCreated({
            transaction,
            body,
          });
          break;
        }
        default:
          console.log("UNKNOWN OP_CODE:", msg.op_code);
          break;
      }
    }
  }
};

export default handleEvent;
