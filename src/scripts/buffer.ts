const hash = 'ygh06NQhiHEQAerY//JMwAJhD89++AbwQsC3Q8qznA4='

// tonclient
const hex = Buffer.from(hash, 'base64').toString('hex')
console.log('hex', hex)

// tonclient4
const buf = Buffer.from(hash, 'base64')
console.log('buf', buf)
const urlSafe = toUrlSafe(buf.toString('base64'))
console.log('urlSafe', urlSafe)

export function toUrlSafe(src: string) {
  while (src.indexOf('/') >= 0) {
    src = src.replace('/', '_')
  }
  while (src.indexOf('+') >= 0) {
    src = src.replace('+', '-')
  }
  while (src.indexOf('=') >= 0) {
    src = src.replace('=', '')
  }
  return src
}
