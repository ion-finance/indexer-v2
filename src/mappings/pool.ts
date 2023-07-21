import { PrismaClient } from "@prisma/client";
import { BurnEvent, ExchangeEvent, MintEvent } from "../types/events";

export const handleExchange = async (event: ExchangeEvent) => {
  const prisma = new PrismaClient();

  await prisma.exchange.create({
    data: {
      from: event.from,
      i: event.i,
      j: event.j,
      amountI: event.amountI.toString(),
      amountJ: event.amountJ.toString(),
      to: event.to,
      poolId: event.transaction.from,
      hash: event.transaction.hash,
    },
  });
};

export const handleBurn = async (event: BurnEvent) => {
  const prisma = new PrismaClient();

  await prisma.burn.create({
    data: {
      from: event.from,
      poolId: event.transaction.from,
      hash: event.transaction.hash,
      amounts: event.amounts,
    },
  });
};

export const handleMint = async (event: MintEvent) => {
  const prisma = new PrismaClient();

  await prisma.mint.create({
    data: {
      from: event.from,
      poolId: event.transaction.from,
      hash: event.transaction.hash,
      amounts: event.amounts,
    },
  });
};
