import { Cell } from "@ton/core";

const parsePoolCreated = (message: Cell) => {
  const body = message.beginParse();
  body.loadUint(32); // skip log code
  const poolAddress = body.loadAddress().toString();
  const tokenXAddress = body.loadAddress().toString();
  const tokenYAddress = body.loadAddress().toString();

  return {
    poolAddress,
    tokenXAddress,
    tokenYAddress,
  };
};

export default parsePoolCreated;
