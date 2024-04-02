import axios from "axios";
import router from "./pools";

const getUSDPrice = (data: any) => data?.quote?.USD?.price || 0;
const getPrice = async () => {
  const response = await axios.get(
    "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=TON,JUSDT,JUSDC",
    {
      headers: {
        Accept: "application/json",
        "X-CMC_PRO_API_KEY": "705f1876-282e-4fc8-b829-1ab345d72b24",
      },
    }
  );
  const { data } = response.data;
  const TON = getUSDPrice(data.TON);
  const JUSDT = getUSDPrice(data.JUSDT);
  const JUSDC = getUSDPrice(data.JUSDC);

  return { TON, JUSDT, JUSDC };
};

// TODO: use cache, add cron job
router.get("/coin-prices", async function handler(req, res) {
  const prices = await getPrice();
  return res.json(prices);
});

export default router;
