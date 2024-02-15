export const getPriceUsd = (symbol?: string) => {
  if (symbol === "iUSDT") return 0.9967;
  if (symbol === "iUSDC") return 0.9967;
  if (symbol === "ION") return 0.9967;
  if (symbol === "pTON") return 2.15;
  return 0;
};
