import { Router } from "express";
import prisma from "../../../clients/prisma";
const router = Router();

router.get("/tokens", async function handler(req, res) {
  const tokens = await prisma.token.findMany();

  return res.json(
    tokens.map((token) => {
      return {
        ...token,
        priceUsd: 0.999967, // mock
        apy: 7.23, // mock
      };
    })
  );
});

export default router;
