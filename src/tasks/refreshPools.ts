import { PoolType } from "@prisma/client";
import prisma from "../clients/prisma";
import ton from "../clients/ton";
import { StablePool } from "../wrappers/StablePool";
import { Address } from "ton-core";
import { VolatilePool } from "../wrappers/VolatilePool";

/*
  Refresh Pool Info
  GET /api/cron/pools
  1. Fetch all pools data from the blockchain.
  2. Update the database.

  TODO
  1. Consider api limit
*/
export const refreshPools = async () => {
  const pools = await prisma.pool.findMany();

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
