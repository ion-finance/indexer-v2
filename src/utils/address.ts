import { sortBy } from "lodash";
import { Address, beginCell } from "@ton/core";
import { Trace } from "../types/ton-api";

export const parseRaw = (raw?: string): string => {
  if (!raw) {
    return "";
  }
  return Address.parseRaw(raw).toString();
};

export const findTracesByOpCode = (trace: Trace, opCode: string) => {
  const result: Trace[] = [];
  // Check if the current transaction's op_code matches the given opCode.
  if (trace.transaction.in_msg?.op_code === opCode) {
    result.push(trace);
  }

  // If the current trace has children, iterate over them and recursively search for the opCode.
  if (trace.children) {
    for (const child of trace.children) {
      const childResults = findTracesByOpCode(child, opCode); // Collect results from children
      if (childResults.length) {
        result.push(...childResults); // Merge child results into the current result set
      }
    }
  }
  return result;
};

export const sortByAddress = (addresses: Address[]) =>
  sortBy(addresses, (address) =>
    BigInt(
      "0x" + beginCell().storeAddress(address).endCell().hash().toString("hex")
    )
  ).reverse();

export const changeNameOfProxyTon = (name: string) => {
  if (name === "Proxy TON") {
    return "TON";
  }
  return name;
};

export const changeSymbolOfProxyTon = (symbol: string) => {
  if (symbol === "pTON" || symbol === "SCAM") {
    console.warn(`Symbol is wrong. Change to ${symbol} to TON`);
    return "TON";
  }
  return symbol;
};
