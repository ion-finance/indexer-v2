import { Cell } from "@ton/core";

const parsePoolCreated = (message: Cell) => {
  const body = message.beginParse();
  body.loadUint(32); // skip log code
  const poolType = body.loadUint(4);
  const poolAddress = body.loadAddress().toString();
  const tokenXAddress = body.loadAddress().toString();
  const tokenYAddress = body.loadAddress().toString();

  return {
    poolAddress,
    poolType,
    tokenXAddress,
    tokenYAddress,
  };
};

export default parsePoolCreated;
