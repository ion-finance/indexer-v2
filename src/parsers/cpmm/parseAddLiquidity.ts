import { Cell } from "@ton/core";

const parseAddLiquidity = (message: Cell) => {
  const body = message.beginParse();
  body.loadUint(32); // skip log code
  const from = body.loadAddress().toString();
  const amountX = body.loadCoins().toString();
  const amountY = body.loadCoins().toString();
  const minted = body.loadCoins().toString();

  return {
    from,
    amountX,
    amountY,
    minted,
  };
};

export default parseAddLiquidity;
