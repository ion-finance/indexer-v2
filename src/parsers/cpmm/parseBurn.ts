import { Cell } from "@ton/core";

const parseBurn = (message: Cell) => {
  const body = message.beginParse();
  body.loadUint(32); // skip log code
  const from = body.loadAddress().toString();
  const amountBuilder = body.loadRef().beginParse();
  const amounts: string[] = [];

  let flag = false;
  while (!flag) {
    try {
      amounts.push(amountBuilder.loadCoins().toString());
    } catch {
      flag = true;
    }
  }

  return {
    from,
    amounts,
  };
};

export default parseBurn;
