import { Cell } from "@ton/core";

const parseExchange = (message: Cell) => {
  const body = message.beginParse();
  body.loadUint(32); // skip log code
  const from = body.loadAddress().toString();
  const i = body.loadUint(2);
  const j = body.loadUint(2);
  const amountI = body.loadCoins().toString();
  const amountJ = body.loadCoins().toString();
  const to = body.loadAddress().toString();

  return {
    from,
    i,
    j,
    amountI,
    amountJ,
    to,
  };
};

export default parseExchange;
