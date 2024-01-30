import { Cell } from "@ton/core";

const parsePoolCreated = (message: Cell) => {
  const body = message.beginParse();
  body.loadUint(32); // skip log code
  const poolType = body.loadUint(4);
  const poolAddress = body.loadAddress().toString();
  const coins_builder = body.loadRef().beginParse();
  const coins: string[] = [];

  let flag = false;
  while (!flag) {
    try {
      coins.push(coins_builder.loadAddress().toString());
    } catch {
      flag = true;
    }
  }

  return {
    poolAddress,
    poolType,
    coins,
  };
};

export default parsePoolCreated;
