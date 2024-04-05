const BINSTEP_NUMERATOR = 10000

export const getBinPrice = (binStep: number, id: number) =>
  (1 + binStep / BINSTEP_NUMERATOR) ** (id - 2 ** 23)

// return normalPrice: price in inputs
export const getNormalPriceByPrice = (
  price: number, // priceXY, priceYX
  decimalsX: number,
  decimalsY: number,
) => {
  return price * 10 ** (decimalsX - decimalsY)
}
