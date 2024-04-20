import { Address, beginCell } from '@ton/core'
import { sortBy } from 'lodash'

import { Trace } from '../types/ton-api'

export const parseRaw = (raw?: string): string => {
  if (!raw) {
    return ''
  }
  return Address.parseRaw(raw).toString()
}

export const findTracesByOpCode = (
  trace: Trace,
  opCode: string,
): Trace[] | null => {
  const result = []
  // Check if the current transaction's op_code matches the given opCode.
  if (trace.transaction.in_msg?.op_code === opCode) {
    result.push(trace)
  }

  // If the current trace has children, iterate over them and recursively search for the opCode.
  if (trace.children) {
    for (const child of trace.children) {
      const childResults = findTracesByOpCode(child, opCode) // Collect results from children
      if (childResults) {
        result.push(...childResults) // Merge child results into the current result set
      }
    }
  }
  if (result.length === 0) {
    return null
  }
  return result
}

// traces which receiver is pool
export const findTracesOfPool = (
  trace: Trace,
  poolAddress: string,
): Trace[] | null => {
  const result = []
  // Check if the current transaction's op_code matches the given opCode.
  const destinationAddress = trace.transaction.in_msg?.destination?.address
  if (isSameAddress(destinationAddress, poolAddress)) {
    result.push(trace)
  }

  // If the current trace has children, iterate over them and recursively search for the opCode.
  if (trace.children) {
    for (const child of trace.children) {
      const childResults = findTracesOfPool(child, poolAddress) // Collect results from children
      if (childResults) {
        result.push(...childResults) // Merge child results into the current result set
      }
    }
  }
  if (result.length === 0) {
    return null
  }
  return result
}

export const sortByAddress = (addresses: Address[]) =>
  sortBy(addresses, (address) =>
    BigInt(
      '0x' + beginCell().storeAddress(address).endCell().hash().toString('hex'),
    ),
  ).reverse()

export const changeNameOfProxyTon = (name: string) => {
  if (name === 'Proxy TON') {
    return 'TON'
  }
  return name
}

export const changeSymbolOfProxyTon = (symbol: string) => {
  if (symbol === 'pTON' || symbol === 'SCAM') {
    console.warn(`Symbol is wrong. Change to ${symbol} to TON`)
    return 'TON'
  }
  return symbol
}

export const isSameAddress = (a?: string, b?: string) => {
  if (!a || !b) return false
  return Address.parse(a).equals(Address.parse(b))
}

export const isTONAddress = (a?: string) => {
  if (!a) return false
  const TON_WALLET_ADDRESS = process.env.TON_WALLET_ADDRESS || ''
  return isSameAddress(a, TON_WALLET_ADDRESS)
}
