import dotenv from "dotenv";
import http from "http";
import handleTransaction from "./tasks/handleTransaction";

dotenv.config();

const PORT = process.env.PORT || 3000;

const main = async () => {
  console.log("ION Finance Indexer");

  // example hash;
  const hash =
    "806f6e9289d0c61f3dd59b2488cfbee8455cdd96dfc2edeb159332e82e98f532";
  await handleTransaction(hash);
};

// health check?
// subscribe websocket
// pooling pool info

main();

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
