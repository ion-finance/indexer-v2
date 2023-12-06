import axios from "axios";
import { TransactionResult } from "../types/ton-api";
import { Address, Cell } from "@ton/core";
import { handleDepositedToBins, handleInitialized } from "../mappings/pool";
import parseDepositedToBins from "../parsers/parseDepositedToBins";
import parseInitialized from "../parsers/parseInitialized";

const DEPOSITED_TO_BINS = "0xafeb11ef";
const INITIALIZED = "0x9bb3a52e";
const SWAP = "0x25938561";

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
      const parseTx = {
        source: Address.parseRaw(tx.transaction.account.address).toString(),
        hash: tx.transaction.hash,
        timestamp: tx.transaction.utime,
      };

      switch (msg.op_code) {
        case DEPOSITED_TO_BINS: {
          await handleDepositedToBins({
            transaction: parseTx,
            params: parseDepositedToBins(body),
          });
          break;
        }
        case INITIALIZED: {
          await handleInitialized({
            transaction: parseTx,
            params: parseInitialized(body),
          });
          break;
        }
        case SWAP: {
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
