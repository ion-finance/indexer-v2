import { PrismaClient } from "@prisma/client";
import { Event, BurnParams, ExchangeParams, MintParams } from "../types/events";

export const handleExchange = async (event: Event<ExchangeParams>) => {
  const prisma = new PrismaClient();

  await prisma.exchange.create({
    data: {
      from: event.params.from,
      i: event.params.i,
      j: event.params.j,
      amountI: event.params.amountI,
      amountJ: event.params.amountJ,
      to: event.params.to,
      poolId: event.transaction.source,
      id: event.transaction.hash,
    },
  });
};

export const handleBurn = async (event: Event<BurnParams>) => {
  const prisma = new PrismaClient();

  await prisma.burn.create({
    data: {
      from: event.params.from,
      poolId: event.transaction.source,
      id: event.transaction.hash,
      amounts: event.params.amounts,
    },
  });
};

export const handleMint = async (event: Event<MintParams>) => {
  const prisma = new PrismaClient();

  await prisma.mint.create({
    data: {
      from: event.params.from,
      poolId: event.transaction.source,
      id: event.transaction.hash,
      amounts: event.params.amounts,
    },
  });
};
