import { Router } from "express";
import prisma from "../../../clients/prisma";
import {
  getBinPrice,
  getNormalPriceByAmountPrice,
} from "../../../utils/binMath";
const router = Router();

router.get("/pool/:pool_address/bins", async function handler(req, res) {
  const poolAddress = req.params.pool_address;

  const [pool, bins] = await Promise.all([
    prisma.pool.findFirst({
      where: {
        id: poolAddress,
      },
    }),
    prisma.bins.findMany({
      where: {
        poolAddress,
      },
    }),
  ]);

  if (!pool) {
    return res.json([]);
  }

  const decimal = 6;
  const binStep = 100; // 1%

  const data = bins.map((bin) => {
    const priceXY = getBinPrice(binStep, 2 ** 23 - bin.binId);
    const priceYX = getBinPrice(binStep, bin.binId - 2 ** 23);

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

router.get("/pools", async function handler(req, res) {
  const pools = await prisma.pool.findMany();
  const tokens = await prisma.token.findMany();

  return res.json(
    pools.map((pool) => {
      const tokenX = tokens.find((token) => token.id === pool.tokenXAddress);
      const tokenY = tokens.find((token) => token.id === pool.tokenYAddress);

      return {
        ...pool,
        tokenX: {
          ...tokenX,
          priceUsd: 0.999967, // mock
          apy: 7.23, // mock
        },
        tokenY: {
          ...tokenY,
          priceUsd: 0.999967, // mock
          apy: 7.23, // mock
        },
        // mock data
        reserveX: "4254160587174121",
        reserveY: "8354160587174",
        totalSupply: "2550988259892",
        liquidityUsd: 17732929.594,
        volumeUsd: 18123142.156,
        feesUsd: 12123,
        apy: 12.16,
      };
    })
  );
});

export default router;
