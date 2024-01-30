import { Cell } from "@ton/core";

const parseAddLiquidity = (message: Cell) => {
  const body = message.beginParse();
  body.loadUint(32); // skip log code
  const from = body.loadAddress().toString();
  const jettonAmount = body.loadCoins().toString();
  const minLpOut = body.loadCoins().toString();
  const targetIndex = body.loadUint(2);
  const intendedAmountsBuilder = body.loadRef().beginParse();
  const intendedAmounts = [];

  let flag = false;
  while (!flag) {
    try {
      intendedAmounts.push(intendedAmountsBuilder.loadCoins().toString());
    } catch {
      flag = true;
    }
  }

  return {
    from,
    jettonAmount,
    minLpOut,
    targetIndex,
    intendedAmounts,
  };
};

export default parseAddLiquidity;
