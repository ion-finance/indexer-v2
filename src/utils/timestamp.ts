export const roundUpTimestampByMinutes = (ts: number) => {
  return Math.floor((ts + 30) / 60) * 60
}
