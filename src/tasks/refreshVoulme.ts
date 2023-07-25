import prisma from "../clients/prisma";
import moment from "moment";

const calcVolume = async (start: number, end: number) => {
  const [exchanges, pools, coins] = await Promise.all([
    prisma.exchange.findMany({
      where: { timestamp: { gte: start, lte: end } },
    }),
    prisma.pool.findMany(),
    prisma.coin.findMany(),
  ]);

  const res = pools.map((pool) => {
    const poolExchanges = exchanges.filter((ex) => ex.poolId === pool.id);

    const volume = poolExchanges.reduce((acc, ex) => {
      const coin = coins.find((coin) => coin.id === pool.coins[ex.j]);

      if (!coin) return acc;

      return (
        acc +
        Number(BigInt(ex.amountJ) / BigInt(10 ** coin.decimals)) * coin.usdPrice
      );
    }, 0);

    return {
      poolId: pool.id,
      volume,
    };
  });

  return res;
};

export const refreshDailyVolume = async () => {
  const res = await calcVolume(
    moment().subtract(1, "days").unix(),
    moment().unix()
  );

  await Promise.allSettled(
    res.map(async (r) => {
      await prisma.pool.update({
        where: { id: r.poolId },
        data: {
          dailyUsdVolume: new Intl.NumberFormat("en-us").format(r.volume),
        },
      });
    })
  );
};
