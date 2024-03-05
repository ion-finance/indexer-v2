import dotenv from "dotenv";
import fetchEvents from "./tasks/fetchEvents";
import handleEvent from "./tasks/handleEvent";
import prisma from "./clients/prisma";
import sleep from "./utils/sleep";
import api from "./api";

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
  let error = false;
  let lastIndex = events.length;
  for (let i = 0; i < events.length; i++) {
    const index = events.length - 1 - i;

    try {
      await handleEvent(events[index].event_id);
    } catch (e) {
      error = true;
      console.error(e);
      console.error(`Error when handling event ${events[index].event_id}`);
      lastIndex = index + 1;
      break;
    }
  }

  if (error) {
    if (lastIndex <= events.length - 1) {
      await prisma.indexerState.setLastTimestamp(events[lastIndex].timestamp);
    }
    sleep(MIN_POOL);
    return;
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

api.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
