import { Router } from "express";
import prisma from "../../../clients/prisma";
import { formatUnits } from "ethers";
import { PoolType } from "@prisma/client";
import { USD_PRICE_OF_TON } from "../../../mocks/price";
const router = Router();

router.get("/positions/:address", async function handler(req, res) {
  const address = req.params.address;

  const [tokens, pools, lpTokenWallets, deposits] = await Promise.all([
    prisma.token.findMany(),
    prisma.pool.findMany(),
    prisma.lpTokenWallet.findMany({
      where: {
        ownerAddress: address,
      },
    }),
    prisma.deposit.findMany({
      where: {
        senderAddress: address,
      },
    }),
  ]);

  const xSum = deposits.reduce((res, cur) => res + Number(cur.amountX), 0);
  const ySum = deposits.reduce((res, cur) => res + Number(cur.amountY), 0);

  const data = lpTokenWallets.map((wallet) => {
    const pool = pools.find((p) => p.id === wallet.poolAddress);
    const tokenX = tokens.find((t) => t.id === pool?.tokenXAddress);
    const tokenY = tokens.find((t) => t.id === pool?.tokenYAddress);

    const lpBalance = (function () {
      if (pool?.type === PoolType.CPMM) {
        return Number(wallet.amount);
      }
      const shares = wallet.shares as { amount: string }[];
      return shares.reduce((res, cur) => {
        return (
          res + (tokenY ? Number(formatUnits(cur.amount, tokenY.decimals)) : 0)
        );
      }, 0);
    })();

    const lpWalletsOfPool = lpTokenWallets.filter(
      (lp) => lp.poolAddress === pool?.id
    );
    const totalLpAmount = lpWalletsOfPool.reduce(
      (res, cur) => res + Number(cur.amount),
      0
    );

    // TODO: remove this.
    // Write all the balance and price using database is too unrealistic.
    // Improve this to utilize blockchain data.

    const tonAddress = "EQA86VCMKZu1HeSg04UqpY5rRIAG3UvgcptW8xC5VhB8btGn";
    const isXisTon = tokenX?.id === tonAddress;
    const isYisTon = tokenY?.id === tonAddress;
    const tonAmount = isXisTon ? xSum : isYisTon ? ySum : 0;
    const totalPriceOfPool = (2 * tonAmount * USD_PRICE_OF_TON) / 10 ** 9;
    const balanceUsd = (lpBalance * totalPriceOfPool) / totalLpAmount;

    return {
      ...wallet,
      feeUsd: 0,
      balanceUsd,
      tokenX: {
        ...tokenX,
        deposited: xSum,
      },
      tokenY: {
        ...tokenY,
        deposited: ySum,
      },
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
