export const toLocaleString = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString('ko-KR')
}
