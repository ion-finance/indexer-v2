import dotenv from "dotenv";
import fetchEvents from "./tasks/fetchEvents";
import handleEvent from "./tasks/handleEvent";
import prisma from "./clients/prisma";
import express from "express";
import cors from "cors";
import sleep from "./utils/sleep";
import _ from "lodash";
import { getBinPrice, getNormalPriceByAmountPrice } from "./utils/binMath";

dotenv.config();

const PORT = process.env.PORT || 3000;
const MIN_POOL = 2000; // 2s

const eventPooling = async () => {
  const events = await fetchEvents();

  if (events.length === 0) {
    // console.debug(`No events found. Sleep for ${MIN_POOL / 1000}s.`);
    sleep(MIN_POOL);
    return;
  }

  console.log(`${events.length} events found.`);
  for (let i = 0; i < events.length; i++) {
    await handleEvent(events[events.length - 1 - i].event_id);
  }
  console.log(`${events.length} events are indexed.`);

  if (events.length > 0) {
    await prisma.indexerState.setLastTimestamp(events[0].timestamp);
  }
};

const main = async () => {
  console.log("Event pooling is started. ");
  for (;;) {
    await eventPooling();
  }
};

main();

const app = express();

app.use(cors());

app.get("/pool/:pool_address/bins", async function handler(req, res) {
  const poolAddress = req.params.pool_address;

  const bins = await prisma.bins.findMany({
    where: {
      poolAddress,
    },
  });

  // TODO : Fix hardcoding
  const tokenXAddress = "EQCUSDFlV_fD20FmFYTeAnEhcfhB0XhFuhV2GszqgZA_l9fi"; // USDC;
  const decimal = 6;
  const binStep = 100; // 1%

  const group = _.groupBy(bins, (bin) => bin.binId);

  const data = _.values(group).map((bins) => {
    const xBin = bins.find((bin) => bin.tokenAddress === tokenXAddress);
    const yBin = bins.find((bin) => bin.tokenAddress !== tokenXAddress);
    const reserveXRaw = xBin?.reserve || "0";
    const reserveYRaw = yBin?.reserve || "0";
    const binId = Number(bins[0].binId);
    const priceXY = getBinPrice(binStep, 2 ** 23 - binId);
    const priceYX = getBinPrice(binStep, binId - 2 ** 23);

    const normalPriceXY = getNormalPriceByAmountPrice(
      priceXY, // normalPriceXY is derived from amountPriceYX
      decimal,
      decimal
    );
    const normalPriceYX = getNormalPriceByAmountPrice(
      priceYX,
      decimal,
      decimal
    );

    return {
      binId,
      priceXY,
      priceYX,
      normalPriceXY,
      normalPriceYX,
      reserveX: Number(BigInt(reserveXRaw) / BigInt(10 ** decimal)),
      reserveY: Number(BigInt(reserveYRaw) / BigInt(10 ** decimal)),
      reserveXRaw,
      reserveYRaw,
    };
  });

  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
