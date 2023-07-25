import prisma from "../clients/prisma";
import axios from "axios";

export const refreshPrices = async () => {
  const coins = await prisma.coin.findMany();

  if (coins.length === 0) {
    return;
  }

  //dai,usd-coin,bitcoin,tether,wrapped-bitcoin,the-open-network&vs_currencies=usd
  const res = await axios.get(
    ` https://api.coingecko.com/api/v3/simple/price?ids=${coins
      .map((coin) => coin.refId)
      .join(",")}&vs_currencies=usd`
  );

  // {"bitcoin":{"usd":29111},"dai":{"usd":0.999844},"tether":{"usd":0.999829},"the-open-network":{"usd":1.41},"usd-coin":{"usd":1.0},"wrapped-bitcoin":{"usd":29111}}
  const prices = res.data;

  await Promise.allSettled(
    coins.map(async (coin) => {
      if (!coin.refId || !prices[coin.refId]) {
        return;
      }
      const price = prices[coin.refId].usd as number;

      await prisma.coin.update({
        where: { id: coin.id },
        data: {
          usdPrice: price,
        },
      });
    })
  );
};
