import { Prisma } from "@prisma/client";
import prisma from "..";
import moment from "moment";
import { StablePool } from "../../../wrappers/StablePool";
import { VolatilePool } from "../../../wrappers/VolatilePool";

const PoolExtensions = Prisma.defineExtension({
  name: `PoolExtensions`,
  model: {
    pool: {
      async applyStablePool(
        id: string,
        storage: Awaited<ReturnType<StablePool["getStorage"]>>
      ) {
        await prisma.pool.update({
          where: {
            id,
          },
          data: {
            fee: Number(storage.fee),
            adminFeeRatio: Number(storage.admin_fee_ratio),
            initialA: storage.initial_A,
            futureA: storage.future_A,
            initialATime: moment.unix(storage.initial_A_time).toDate(),
            futureATime: moment.unix(storage.future_A_time).toDate(),
            totalSupply: storage.total_supply_lp.toString(),
            isInitialized: storage.is_initialized,
            coins: storage.coins.map((c) => c.toString()),
            balances: storage.balances.map((b) => b.toString()),
            collectedAdminFees: storage.collected_admin_fees.map((b) =>
              b.toString()
            ),
          },
        });
      },
      async applyVolatilePool(
        id: string,
        storage: Awaited<ReturnType<VolatilePool["getStorage"]>>
      ) {
        await prisma.pool.update({
          where: { id },
          data: {
            fee: Number(storage.fee),
            adminFeeRatio: Number(storage.admin_fee_ratio),
            totalSupply: storage.total_supply_lp.toString(),
            isInitialized: storage.is_initialized,
            coins: storage.coins.map((c) => c.toString()),
            balances: storage.balances.map((b) => b.toString()),
            collectedAdminFees: storage.collected_admin_fees.map((b) =>
              b.toString()
            ),
          },
        });
      },
    },
  },
});

export default PoolExtensions;
