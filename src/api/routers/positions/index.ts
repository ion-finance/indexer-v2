import { Router } from "express";
import prisma from "../../../clients/prisma";
import { parseUnits } from "ethers";
const router = Router();

router.get("/positions/:address", async function handler(req, res) {
  const address = req.params.address;

  const [tokens, pools, lpTokenWallets] = await Promise.all([
    prisma.token.findMany(),
    prisma.pool.findMany(),
    prisma.lpTokenWallet.findMany({
      where: {
        ownerAddress: address,
      },
    }),
  ]);

  const data = lpTokenWallets.map((wallet) => {
    const pool = pools.find((p) => p.id === wallet.poolAddress);
    const tokenY = tokens.find((t) => t.id === pool?.tokenYAddress);

    const totalBalance = (wallet.shares as { amount: string }[]).reduce(
      (res, cur) => {
        return (
          res + (tokenY ? Number(parseUnits(cur.amount, tokenY.decimals)) : 0)
        );
      },
      0
    );

    return {
      ...wallet,
      feeUsd: 0,
      balanceUsd: totalBalance, // TODO apply token price
    };
  });

  return res.json({
    summary: {
      balanceUsd: data.reduce((res, cur) => res + cur.balanceUsd, 0),
      apy: 12.2,
      earnedUsd: 0,
    },
    positions: data,
  });
});

export default router;
