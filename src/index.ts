import { PrismaClient } from "@prisma/client";
import http from "http";

const PORT = process.env.PORT || 3000;

export const server = http.createServer(async (req, res) => {
  const prisma = new PrismaClient();
  const coins = await prisma.coin.findMany();
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      data: coins,
    })
  );
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/`);
});
