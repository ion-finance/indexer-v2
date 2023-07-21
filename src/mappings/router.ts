import { PoolType, PrismaClient } from "@prisma/client";
import { Event, PoolCreatedParams } from "../types/events";
import { times } from "lodash";

export const handlePoolCreated = async (event: Event<PoolCreatedParams>) => {
  const prisma = new PrismaClient();

  await prisma.pool.upsert({
    where: {
      id: event.params.poolAddress,
    },
    create: {
      id: event.params.poolAddress,
      coins: event.params.coins,
      name: "UnknownPool",
      description: "",
      type: event.params.poolType === 0 ? PoolType.STABLE : PoolType.VOLATILE,
      image: "",
      symbol: "UP",
      balances: times(event.params.coins.length, () => "0"),
      rates: [],
      collectedAdminFees: times(event.params.coins.length, () => "0"),
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
