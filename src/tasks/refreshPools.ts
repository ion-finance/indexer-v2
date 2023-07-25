import { Coin, Pool, PoolType } from "@prisma/client";
import prisma from "../clients/prisma";
import ton from "../clients/ton";
import { StablePool } from "../wrappers/StablePool";
import { Address } from "ton-core";
import { VolatilePool } from "../wrappers/VolatilePool";
import moment from "moment";
import { uniq } from "lodash";

export const refreshPools = async (pools: Pool[], coins: Coin[]) => {
  await Promise.allSettled(
    pools
      .filter((pool) => pool.type === PoolType.STABLE)
      .map(async (pool) => {
        const poolContract = ton.open(
          StablePool.createFromAddress(Address.parse(pool.id))
        );

        const storage = await poolContract.getStorage();
        await prisma.pool.applyStablePool(pool.id, storage);

        const usdTVL = storage.balances.reduce((acc, balance, i) => {
          const coin = coins.find((coin) => coin.id === pool.coins[i]);

          if (!coin) return acc;

          return (
            acc +
            Number(
              (BigInt(balance) * BigInt(1000)) / BigInt(10 ** coin.decimals)
            ) *
              (coin.usdPrice / 1000)
          );
        }, 0);

        await prisma.pool.update({
          where: { id: pool.id },
          data: {
            usdTVL: new Intl.NumberFormat("en-us").format(usdTVL),
          },
        });
      })
  );

  await Promise.allSettled(
    pools
      .filter((pool) => pool.type === PoolType.VOLATILE)
      .map(async (pool) => {
        const poolContract = ton.open(
          VolatilePool.createFromAddress(Address.parse(pool.id))
        );

        const storage = await poolContract.getStorage();
        await prisma.pool.applyVolatilePool(pool.id, storage);

        const usdTVL = storage.balances.reduce((acc, balance, i) => {
          const coin = coins.find((coin) => coin.id === pool.coins[i]);

          if (!coin) return acc;

          return (
            acc +
            Number(BigInt(balance) / BigInt(10 ** coin.decimals)) *
              coin.usdPrice
          );
        }, 0);
        await prisma.pool.update({
          where: { id: pool.id },
          data: {
            usdTVL: new Intl.NumberFormat("en-us").format(usdTVL),
          },
        });
      })
  );

  return;
};

/*
  Refresh Pools Info when poll has new events
*/
export const refreshPoolsIfRecentEventsExist = async () => {
  const time = moment().subtract(20, "seconds");
  const [exchanges, mints, burns, coins] = await Promise.all([
    prisma.exchange.findMany({
      where: {
        createdAt: { gte: time.toDate() },
      },
    }),
    prisma.mint.findMany({
      where: {
        createdAt: { gte: time.toDate() },
      },
    }),
    prisma.burn.findMany({
      where: {
        createdAt: { gte: time.toDate() },
      },
    }),
    prisma.coin.findMany(),
  ]);

  const poolIds = uniq([
    ...exchanges.map((exchange) => exchange.poolId),
    ...mints.map((mint) => mint.poolId),
    ...burns.map((burn) => burn.poolId),
  ]);

  const pools = await prisma.pool.findMany({ where: { id: { in: poolIds } } });

  return await refreshPools(pools, coins);
};

export const refreshAllPools = async () => {
  const [pools, coins] = await Promise.all([
    await prisma.pool.findMany(),
    await prisma.coin.findMany(),
  ]);

  return await refreshPools(pools, coins);
};
