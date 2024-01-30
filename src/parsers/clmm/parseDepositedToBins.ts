import { Dictionary, Cell } from "@ton/core";

const parseDepositedToBins = (message: Cell) => {
  const body = message.beginParse();
  const logCode = body.loadUint(32);
  const senderAddress = body.loadAddress().toString();
  const receiverAddress = body.loadAddress().toString();
  const tokenAddress = body.loadAddress().toString();
  const deposited = body.loadDict(Dictionary.Keys.Uint(24), {
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
    receiverAddress,
    tokenAddress,
    deposited,
  };
};

export default parseDepositedToBins;
