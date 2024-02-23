import { Router } from "express";
import prisma from "../../../clients/prisma";
import {
  getBinPrice,
  getNormalPriceByAmountPrice,
} from "../../../utils/binMath";
const router = Router();

router.get("/bins", async function handler(req, res) {
  const { poolAddress } = req.query;

  if (!poolAddress) {
    return res.json([]);
  }

  const [pool, bins] = await Promise.all([
    prisma.pool.findFirst({
      where: {
        id: poolAddress as string,
      },
    }),
    prisma.bins.findMany({
      where: {
        poolAddress: poolAddress as string,
      },
    }),
  ]);

  if (!pool) {
    return res.json([]);
  }

  const decimal = 6;
  const binStep = 100; // 1%

  const data = bins.map((bin) => {
    const priceXY = getBinPrice(binStep, -bin.binId);
    const priceYX = getBinPrice(binStep, bin.binId);

    const normalPriceXY = getNormalPriceByAmountPrice(
      priceXY, // normalPriceXY is derived from amountPriceYX
      decimal,
      decimal
    );
    const normalPriceYX = getNormalPriceByAmountPrice(
      priceYX,
      decimal,
      decimal
    );

    return {
      binId: bin.binId,
      priceXY,
      priceYX,
      normalPriceXY,
      normalPriceYX,
      reserveX: Number(BigInt(bin.reserveX) / BigInt(10 ** decimal)),
      reserveY: Number(BigInt(bin.reserveY) / BigInt(10 ** decimal)),
      reserveXRaw: bin.reserveX,
      reserveYRaw: bin.reserveY,
    };
  });

  return res.json(data);
});

export default router;
