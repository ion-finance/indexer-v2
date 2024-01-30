import { Dictionary, Cell } from "@ton/core";

const parseTransferBatch = (message: Cell) => {
  const body = message.beginParse();
  const logCode = body.loadUint(32);
  const senderAddress = body.loadAddress().toString();
  const fromAddress = body.loadAddress().toString();
  const toAddress = body.loadAddress().toString();
  const amounts = body.loadDict(Dictionary.Keys.Uint(24), {
    serialize: (src: { amount: bigint }, builder) => {
      builder.storeUint(src.amount, 256);
    },
    parse: (src) => {
      const amount = src.loadCoins();
      return { amount };
    },
  });

  return {
    logCode,
    senderAddress,
    fromAddress,
    toAddress,
    amounts,
  };
};

export default parseTransferBatch;
