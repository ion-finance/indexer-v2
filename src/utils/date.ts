export const toLocaleString = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString('ko-KR')
}

export const toISOString = (utime: number) => {
  return new Date(utime * 1000).toISOString()
}

export const ONE_DAY = 24 * 60 * 60 * 1000
