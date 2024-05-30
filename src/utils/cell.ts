import { Cell } from '@ton/core'
export const bodyToCell = (body: string): Cell => {
  return Cell.fromBoc(Buffer.from(body, 'hex'))[0]
}

export const msgToCell = (msg: string): Cell => {
  return Cell.fromBase64(msg)
}
