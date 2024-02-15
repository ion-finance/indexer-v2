import { Router } from "express";
import prisma from "../../../clients/prisma";
import { getPriceUsd } from "../../../mocks/price";
const router = Router();

router.get("/tokens", async function handler(req, res) {
  const tokens = await prisma.token.findMany();

  return res.json(
    tokens.map((token) => {
      const priceUsd = getPriceUsd(token?.symbol);

      return {
        ...token,
        priceUsd,
        apy: 7.23, // mock
      };
    })
  );
});

export default router;
