import { Cell } from "@ton/core";

const parseInitialized = (message: Cell) => {
  const body = message.beginParse();
  const logCode = body.loadUint(32);
  const binStep = body.loadUint(8);
  const activeId = body.loadUint(24);
  const tokenXAddress = body.loadAddress().toString();
  const tokenYAddress = body.loadAddress().toString();

  return {
    logCode,
    binStep,
    activeId,
    tokenXAddress,
    tokenYAddress,
  };
};

export default parseInitialized;
