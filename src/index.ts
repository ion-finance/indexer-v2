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
  let error = false;
  for (let i = 0; i < events.length; i++) {
    try {
      await handleEvent(events[events.length - 1 - i].event_id);
    } catch (e) {
      error = true;
      console.error(`Error when handling event ${events[i].event_id}`);
    }
  }

  if (error) {
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

const app = express();

app.use(cors());

app.get("/pool/:pool_address/bins", async function handler(req, res) {
  const poolAddress = req.params.pool_address;

  const [pool, bins] = await Promise.all([
    prisma.pool.findFirst({
      where: {
        id: poolAddress,
      },
    }),
    prisma.bins.findMany({
      where: {
        poolAddress,
      },
    }),
  ]);

  if (!pool) {
    return res.json([]);
  }

  const decimal = 6;
  const binStep = 100; // 1%

  const data = bins.map((bin) => {
    const priceXY = getBinPrice(binStep, 2 ** 23 - bin.binId);
    const priceYX = getBinPrice(binStep, bin.binId - 2 ** 23);

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
      binId: bin.binId,
      priceXY,
      priceYX,
      normalPriceXY,
      normalPriceYX,
      reserveX: Number(BigInt(bin.reserveX) / BigInt(10 ** decimal)),
      reserveY: Number(BigInt(bin.reserveY) / BigInt(10 ** decimal)),
      reserveXRaw: bin.reserveX,
      reserveYRaw: bin.reserveY,
    };
  });

  return res.json(data);
});

app.get("/accounts/:address/history", async function handler(req, res) {
  /*
  const address = req.params.address;

  const [deposit, withdraw, swap] = await Promise.all([
    prisma.depositedToBins.findMany({ where: { senderAddress: address } }),
    prisma.withdrawnFromBins.findMany({ where: { senderAddress: address } }),
    prisma.swap.findMany({ where: { senderAddress: address } }),
  ]);

  return res.json({
    deposit,
    withdraw,
    swap,
  });
  */

  return res.json({
    deposit: [
      {
        id: "395a8f0f33ef97d67e2b17114bfd3007dbca6f5f915f7a975ba8bfe9ec015117",
        createdAt: "2023-12-20 10:00:27.451",
        timestamp: 1701863435,
        tokenAddress: "EQBDjGFi2J4uEvqHI66qX_PA5M2T0yHzdKnLDThoHLUdgcGH",
        poolAddress: "EQDeFZXkU2eMz8PRSkt6tEJaQgV2WU2BBMBZEQqVl4KVaAp_",
        deposited: [
          { binId: 8388604, amount: "10000000" },
          { binId: 8388605, amount: "10000000" },
          { binId: 8388606, amount: "10000000" },
          { binId: 8388607, amount: "10000000" },
          { binId: 8388608, amount: "10000000" },
        ],
      },
    ],
    withdraw: [
      {
        id: "9f29502d94e83da176f7bab3d242902a4af212dc53c01e15673954f3a5a87229",
        createdAt: "2023-12-21 10:00:27.451",
        timestamp: 1701865435,
        poolAddress: "EQDeFZXkU2eMz8PRSkt6tEJaQgV2WU2BBMBZEQqVl4KVaAp_",
        withdrawn: [
          { binId: 8388604, amount: "10000000" },
          { binId: 8388605, amount: "10000000" },
          { binId: 8388606, amount: "10000000" },
          { binId: 8388607, amount: "10000000" },
          { binId: 8388608, amount: "10000000" },
        ],
      },
    ],
    swap: [
      {
        id: "395f12454c0910b25a39ced728ac296f51f79c786f9322074dd54801af59f904",
        timestamp: 1701865435,
        poolAddress: "EQDeFZXkU2eMz8PRSkt6tEJaQgV2WU2BBMBZEQqVl4KVaAp_",
        amountIn: "10000000",
        amountOut: "10000000",
        swapForY: true,
      },
      {
        id: "7b066c7c1186bfa897854f0afbf0c1484cdad5b6b0a7063ef5f5b78ce4d066f0",
        timestamp: 1701866435,
        poolAddress: "EQDeFZXkU2eMz8PRSkt6tEJaQgV2WU2BBMBZEQqVl4KVaAp_",
        amountIn: "10000000",
        amountOut: "10000000",
        swapForY: false,
      },
    ],
  });
});

// TODO
// 1. calc balances usd
// 2. remove mock data
app.get("/accounts/:address/positions", async function handler(req, res) {
  const address = req.params.address;

  /*
    const lpTokenWallets = await prisma.lpTokenWallet.findMany({
      where: {
        ownerAddress: address,
      },
    });

    return res.json(lpTokenWallets);
    */

  // Mock data
  return res.json({
    summary: {
      balanceUsd: "100000",
      earnedUsd: "0",
    },
    positions: [
      {
        poolAddress: "EQDeFZXkU2eMz8PRSkt6tEJaQgV2WU2BBM1BZEQqVl4KVaAp_",
        ownerAddress: address,
        amounts: [
          { binId: 8388606, amount: "4000000" },
          { binId: 8388607, amount: "4000000" },
          { binId: 8388608, amount: "2000000" },
        ],
        feeUsd: "0",
        balanceUsd: "100000",
      },
    ],
  });
});

app.get("/tokens", async function handler(req, res) {
  const tokens = await prisma.token.findMany();

  return res.json(
    tokens.map((token) => {
      return {
        ...token,
        priceUsd: 0.999967, // mock
        apy: 7.23, // mock
      };
    })
  );
});

app.get("/pools", async function handler(req, res) {
  const pools = await prisma.pool.findMany();
  const tokens = await prisma.token.findMany();

  return res.json(
    pools.map((pool) => {
      const tokenX = tokens.find((token) => token.id === pool.tokenXAddress);
      const tokenY = tokens.find((token) => token.id === pool.tokenYAddress);

      return {
        ...pool,
        tokenX: {
          ...tokenX,
          priceUsd: 0.999967, // mock
          apy: 7.23, // mock
        },
        tokenY: {
          ...tokenY,
          priceUsd: 0.999967, // mock
          apy: 7.23, // mock
        },
        // mock data
        reserveX: "4254160587174121",
        reserveY: "8354160587174",
        totalSupply: "2550988259892",
        liquidityUsd: 17732929.594,
        volumeUsd: 18123142.156,
        feesUsd: 12123,
        apy: 12.15,
      };
    })
  );
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
