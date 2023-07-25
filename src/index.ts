import dotenv from "dotenv";
import http from "http";
import cron from "node-cron";
import fetchEvents from "./tasks/fetchEvents";
import handleEvent from "./tasks/handleEvent";
import prisma from "./clients/prisma";
import sleep from "./utils/sleep";
import {
  refreshAllPools,
  refreshPoolsIfRecentEventsExist,
} from "./tasks/refreshPools";
import { refreshDailyAPY, refreshWeeklyApy } from "./tasks/refreshAPY";
import { refreshPrices } from "./tasks/refreshPrices";
import { refreshDailyVolume } from "./tasks/refreshVoulme";

dotenv.config();

const PORT = process.env.PORT || 3000;
const MIN_POOL = 4000; // 4s

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
  await refreshPrices();
  await refreshDailyVolume();
  await refreshDailyAPY();
  await refreshWeeklyApy();
  await refreshAllPools();
  console.log("Initial data is refreshed.");

  console.log("Event pooling is started. ");
  for (;;) {
    await eventPooling();
  }
};

main();

cron.schedule("0 * * * *", async () => {
  await refreshPrices();
  await refreshDailyVolume();
  await refreshDailyAPY();
  await refreshWeeklyApy();
});

cron.schedule("*/10 * * * * *", async () => {
  await refreshPoolsIfRecentEventsExist();
});

cron.schedule("* * * * *", async () => {
  await refreshAllPools();
});

export const server = http.createServer(async (req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      greeting: "hello",
    })
  );
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/`);
});
