import { BINSTEP_NUMERATOR, getBinPrice } from "./binMath";
import { Bins } from "@prisma/client";

const calcAmountsFromPosition = (
  bins: Bins[],
  shares: { binId: number; amount: number }[],
  binStep: number
) => {
  return shares.map((share) => {
    const bin = bins.find((b) => b.binId === share.binId);

    if (!bin) {
      return {
        price: 0,
        binId: share.binId,
        amount: share.amount,
        amountX: BigInt(0),
        amountY: BigInt(0),
      };
    }

    const price = getBinPrice(binStep, bin.binId - 2 ** 23);

    const liquidity =
      (BigInt(bin.reserveX) * BigInt(Math.floor(price * BINSTEP_NUMERATOR))) /
        BigInt(BINSTEP_NUMERATOR) +
      BigInt(bin.reserveY);

    return {
      price,
      binId: share.binId,
      amount: share.amount,
      amountX: (BigInt(share.amount) * BigInt(bin.reserveX)) / liquidity,
      amountY: (BigInt(share.amount) * BigInt(bin.reserveY)) / liquidity,
    };
  });
};

export default calcAmountsFromPosition;
