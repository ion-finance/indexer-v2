import { Cell } from "@ton/core";

const parseMint = (message: Cell) => {
  const body = message.beginParse();
  body.loadUint(32); // skip log code
  const from = body.loadAddress().toString();
  const amount_builder = body.loadRef().beginParse();
  const amounts: string[] = [];

  let flag = false;
  while (!flag) {
    try {
      amounts.push(amount_builder.loadCoins().toString());
    } catch {
      flag = true;
    }
  }

  return {
    from,
    amounts,
  };
};

export default parseMint;
