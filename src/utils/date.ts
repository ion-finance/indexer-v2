export const toLocaleString = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString('ko-KR')
}

export const ONE_DAY = 24 * 60 * 60 * 1000
