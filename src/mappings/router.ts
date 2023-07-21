import { PoolType, PrismaClient } from "@prisma/client";
import { PoolCreatedEvent } from "../types/events";
import { times } from "lodash";

export const handlePoolCreated = async (event: PoolCreatedEvent) => {
  const prisma = new PrismaClient();

  await prisma.pool.upsert({
    where: {
      id: event.poolAddress,
    },
    create: {
      id: event.poolAddress,
      coins: event.coins,
      name: "UnknownPool",
      description: "",
      type: event.poolType === 0 ? PoolType.STABLE : PoolType.VOLATILE,
      image: "",
      symbol: "UP",
      balances: times(event.coins.length, () => "0"),
      rates: [],
      collectedAdminFees: times(event.coins.length, () => "0"),
      initialA: 0,
      futureA: 0,
      initialATime: new Date(),
      futureATime: new Date(),
      fee: 0,
      adminFeeRatio: 0,
      isInitialized: true,
      totalSupply: "0",
      apy: "0",
    },
    update: {},
  });
};
