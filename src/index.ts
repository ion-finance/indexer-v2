import dotenv from "dotenv";
import http from "http";
import cron from "node-cron";
import { refreshPools } from "./tasks/refreshPools";

dotenv.config();

const PORT = process.env.PORT || 3000;

cron.schedule("*/10 * * * * *", async () => {
  await refreshPools();
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
