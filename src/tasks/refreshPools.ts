import { Pool, PoolType } from "@prisma/client";
import prisma from "../clients/prisma";
import ton from "../clients/ton";
import { StablePool } from "../wrappers/StablePool";
import { Address } from "ton-core";
import { VolatilePool } from "../wrappers/VolatilePool";
import moment from "moment";
import { uniq } from "lodash";

export const refreshPools = async (pools: Pool[]) => {
  await Promise.allSettled(
    pools
      .filter((pool) => pool.type === PoolType.STABLE)
      .map(async (pool) => {
        const poolContract = ton.open(
          StablePool.createFromAddress(Address.parse(pool.id))
        );

        const storage = await poolContract.getStorage();

        await prisma.pool.applyStablePool(pool.id, storage);
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
      })
  );

  return;
};

/*
  Refresh Pools Info when poll has new events
*/
export const refreshPoolsIfRecentEventsExist = async () => {
  const time = moment().subtract(20, "seconds");
  const [exchanges, mints, burns] = await Promise.all([
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
  ]);

  const poolIds = uniq([
    ...exchanges.map((exchange) => exchange.poolId),
    ...mints.map((mint) => mint.poolId),
    ...burns.map((burn) => burn.poolId),
  ]);

  const pools = await prisma.pool.findMany({ where: { id: { in: poolIds } } });

  return await refreshPools(pools);
};

export const refreshAllPools = async () => {
  const pools = await prisma.pool.findMany();

  return await refreshPools(pools);
};
