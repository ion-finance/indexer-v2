export const USD_PRICE_OF_TON = 2.67;
export const getPriceUsd = (symbol?: string) => {
  if (symbol === "iUSDT") return 0.9967;
  if (symbol === "iUSDC") return 0.9967;
  if (symbol === "ION") return 0.9967;
  if (symbol === "TON") return USD_PRICE_OF_TON;
  return 0;
};
