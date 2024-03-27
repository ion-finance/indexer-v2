import { sortBy } from "lodash";
import { Address, beginCell } from "@ton/core";

export const parseRaw = (raw?: string): string => {
  if (!raw) {
    return "";
  }
  return Address.parseRaw(raw).toString();
};

export const findTracesByOpCode = (trace: any, opCode: any): any => {
  const result: any[] = [];
  // Check if the current transaction's op_code matches the given opCode.
  if (trace.transaction.in_msg.op_code === opCode) {
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
