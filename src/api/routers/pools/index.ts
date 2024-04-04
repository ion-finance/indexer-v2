import { Router } from "express";
import prisma from "../../../clients/prisma";
import { getPriceUsd } from "../../../mocks/price";
import { compact } from "lodash";

const router = Router();

router.get("/pools", async function handler(req, res) {
  const rawPools = await prisma.pool.findMany();
  const tokens = await prisma.token.findMany();
  const bins = await prisma.bins.findMany();

  const pools = rawPools.map((pool) => {
    const tokenX = tokens.find((token) => token.id === pool.tokenXAddress);
    const tokenY = tokens.find((token) => token.id === pool.tokenYAddress);
    const { reserveX, reserveY } = pool;
    if (pool.type === "CPMM") {
      if (!Number(reserveX) || !Number(reserveY)) {
        console.warn("Reserve not found", pool.id);
        return;
      }
    }
    if (!tokenX) {
      console.warn("TokenX not found", pool.tokenXAddress);
      return;
    }

    if (!tokenY) {
      console.warn("TokenY not found", pool.tokenYAddress);
      return;
    }

    const priceXUsd = getPriceUsd(tokenX?.symbol);
    const priceYUsd = getPriceUsd(tokenY?.symbol);

    let reserveData = {};

    if (pool.type === "CLMM") {
      const poolBins = bins.filter((bin) => bin.poolAddress === pool.id);

      reserveData = {
        reserveX: poolBins
          .reduce((acc, bin) => acc + BigInt(bin.reserveX), BigInt(0))
          .toString(),
        reserveY: poolBins
          .reduce((acc, bin) => acc + BigInt(bin.reserveY), BigInt(0))
          .toString(),
        totalSupply: "2550988259892", // TODO
      };
    } else {
      reserveData = {
        reserveX: pool.reserveX,
        reserveY: pool.reserveY,
        totalSupply: pool.lpSupply,
      };
    }

    return {
      ...pool,
      tokenX: {
        ...tokenX,
        priceUsd: priceXUsd,
        apy: 7.23, // mock
      },
      tokenY: {
        ...tokenY,
        priceUsd: priceYUsd,
        apy: 7.23, // mock
      },
      ...reserveData,
      // mock data
      liquidityUsd: 17732929.594,
      volumeUsd: 18123142.156,
      feesUsd: 12123,
      apy: 12.16,
    };
  });
  return res.json(compact(pools));
});

export default router;
