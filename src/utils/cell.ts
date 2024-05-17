import { Cell } from '@ton/core'
export const bodyToCell = (body: string): Cell => {
  return Cell.fromBoc(Buffer.from(body, 'hex'))[0]
}
