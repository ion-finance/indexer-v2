import { PoolType, Exchange, Mint, Burn } from "@prisma/client";
import prisma from "../clients/prisma";
import _ from "lodash";
import { toNano } from "ton-core";
import moment from "moment";

// TODO : Include mint & burns
// burn & mint fee
// 1. If balances, free
// 2. If not, 0.02%
// TODO : Add Volatile pool apy
const calcAPY = async (start: number, end: number) => {
  const [exchanges, mints, burns, pools] = await Promise.all([
    prisma.exchange.findMany({
      where: { timestamp: { gte: start, lte: end } },
    }),
    prisma.mint.findMany({
      where: { timestamp: { gte: start, lte: end } },
    }),
    prisma.burn.findMany({
      where: { timestamp: { gte: start, lte: end } },
    }),
    prisma.pool.findMany(),
  ]);

  const txs = _.sortBy(
    [
      ...exchanges.map((exchange) => ({
        poolId: exchange.poolId,
        type: "exchange",
        timestamp: exchange.timestamp,
        data: exchange,
      })),
      ...burns.map((burn) => ({
        poolId: burn.poolId,
        type: "burn",
        timestamp: burn.timestamp,
        data: burn,
      })),
      ...mints.map((mint) => ({
        poolId: mint.poolId,
        type: "mint",
        timestamp: mint.timestamp,
        data: mint,
      })),
    ],
    ["timestamp"],
    ["asc"]
  );

  const res = pools
    .filter((pool) => pool.type === PoolType.STABLE)
    .map((pool) => {
      let startBalances = pool.balances.map((balance) => BigInt(balance));
      const poolTxs = txs.filter((tx) => tx.poolId === pool.id);

      poolTxs.forEach((tx) => {
        if (tx.type === "exchange") {
          const data = tx.data as Exchange;

          startBalances = startBalances.map((balance, i) => {
            if (data.i === i) {
              const b = balance - BigInt(data.amountI);
              return b > 0 ? b : BigInt(0);
            } else if (data.j === i) {
              return balance + BigInt(data.amountJ);
            }
            return balance;
          });
        } else if (tx.type === "burn") {
          const data = tx.data as Burn;
          startBalances = startBalances.map((balance, i) => {
            return balance + BigInt(data.amounts[i]);
          });
        } else if (tx.type === "mint") {
          const data = tx.data as Mint;
          startBalances = startBalances.map((balance, i) => {
            const b = balance - BigInt(data.amounts[i]);
            return b > 0 ? b : BigInt(0);
          });
        }
      });

      let avgBalances = BigInt(0);
      let current = start;

      poolTxs.forEach((tx) => {
        const normalizedSum = startBalances.reduce((acc, balance, i) => {
          return acc + (balance * BigInt(pool.rates[i])) / toNano(1);
        }, BigInt(0));

        avgBalances +=
          (normalizedSum * BigInt(tx.timestamp - current)) /
          BigInt(end - start);

        if (tx.type === "exchange") {
          const data = tx.data as Exchange;

          startBalances = startBalances.map((balance, i) => {
            if (data.i === i) {
              const b = balance + BigInt(data.amountI);
              return b > 0 ? b : BigInt(0);
            } else if (data.j === i) {
              return balance - BigInt(data.amountJ);
            }
            return balance;
          });
        } else if (tx.type === "burn") {
          const data = tx.data as Burn;

          startBalances = startBalances.map((balance, i) => {
            const b = balance - BigInt(data.amounts[i]);
            return b > 0 ? b : BigInt(0);
          });
        } else {
          const data = tx.data as Mint;

          startBalances = startBalances.map((balance, i) => {
            return balance + BigInt(data.amounts[i]);
          });
        }

        current = tx.timestamp;
      });

      const currentNomalizedSum = startBalances.reduce(
        (acc, balance, i) =>
          acc + (BigInt(balance) * BigInt(pool.rates[i])) / toNano(1),
        BigInt(0)
      );

      avgBalances +=
        (currentNomalizedSum * BigInt(end - current)) / BigInt(end - start);

      const totalFees = exchanges
        .filter((ex) => ex.poolId === pool.id)
        .reduce(
          (acc, exchange) =>
            acc +
            (BigInt(exchange.amountJ) *
              BigInt(pool.rates[exchange.j]) *
              BigInt(2)) /
              toNano(1 * 10000),
          BigInt(0)
        );

      // decimal = 9
      /*
        APY = [(1 + r)**n] – 1
        Where:
        * r = periodic rate
        * n = number of compounding periods
      */
      const r =
        avgBalances === BigInt(0) ? 0 : (totalFees * toNano(1)) / avgBalances;
      const n = BigInt(365 * 24 * 3600) / BigInt(end - start);

      const apy = (1 + Number(r) / Number(toNano(1))) ** Number(n) - 1;

      return {
        poolId: pool.id,
        apy: new Intl.NumberFormat("en-US", {
          style: "percent",
          minimumFractionDigits: 0,
          maximumFractionDigits: 4,
        }).format(apy / 100),
      };
    });

  return res;
};

export const refreshDailyAPY = async () => {
  const res = await calcAPY(
    moment().subtract(1, "days").unix(),
    moment().unix()
  );

  await Promise.allSettled(
    res.map(async (r) => {
      await prisma.pool.update({
        where: { id: r.poolId },
        data: {
          dailyAPY: r.apy,
        },
      });
    })
  );
};

export const refreshWeeklyApy = async () => {
  const res = await calcAPY(
    moment().subtract(7, "days").unix(),
    moment().unix()
  );

  await Promise.allSettled(
    res.map(async (r) => {
      await prisma.pool.update({
        where: { id: r.poolId },
        data: {
          weeklyAPY: r.apy,
        },
      });
    })
  );
};
