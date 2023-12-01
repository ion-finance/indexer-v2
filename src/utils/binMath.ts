const BINSTEP_NUMERATOR = 10000;

export const getBinPrice = (binStep: number, id: number) =>
  (1 + binStep / BINSTEP_NUMERATOR) ** id;

// return normalPrice: price in inputs
export const getNormalPriceByAmountPrice = (
  amountPrice: number, // priceXY, priceYX
  fromTokenDecimals: number,
  toTokenDecimals: number
) => {
  return 10 ** (fromTokenDecimals - toTokenDecimals) / amountPrice;
};
