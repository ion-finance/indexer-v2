import { Router } from "express";
import prisma from "../../../clients/prisma";

const router = Router();

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
