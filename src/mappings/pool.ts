import { Event, BurnParams, ExchangeParams, MintParams } from "../types/events";
import prisma from "../clients/prisma";

export const handleExchange = async (event: Event<ExchangeParams>) => {
  console.debug("Exchange event is indexed.");
  console.debug(event);

  await prisma.exchange.upsert({
    where: {
      id: event.transaction.hash,
    },
    update: {
      from: event.params.from,
      i: event.params.i,
      j: event.params.j,
      amountI: event.params.amountI,
      amountJ: event.params.amountJ,
      to: event.params.to,
      poolId: event.transaction.source,
      timestamp: event.transaction.timestamp,
    },
    create: {
      id: event.transaction.hash,
      from: event.params.from,
      i: event.params.i,
      j: event.params.j,
      amountI: event.params.amountI,
      amountJ: event.params.amountJ,
      to: event.params.to,
      poolId: event.transaction.source,
      timestamp: event.transaction.timestamp,
    },
  });
};

export const handleBurn = async (event: Event<BurnParams>) => {
  console.debug("Burn event is indexed.");
  console.debug(event);

  await prisma.burn.upsert({
    where: {
      id: event.transaction.hash,
    },
    update: {
      from: event.params.from,
      poolId: event.transaction.source,
      amounts: event.params.amounts,
      timestamp: event.transaction.timestamp,
    },
    create: {
      id: event.transaction.hash,
      from: event.params.from,
      poolId: event.transaction.source,
      amounts: event.params.amounts,
      timestamp: event.transaction.timestamp,
    },
  });
};

export const handleMint = async (event: Event<MintParams>) => {
  console.debug("Mint event is indexed.");
  console.debug(event);

  await prisma.mint.upsert({
    where: {
      id: event.transaction.hash,
    },
    update: {
      from: event.params.from,
      poolId: event.transaction.source,
      amounts: event.params.amounts,
      timestamp: event.transaction.timestamp,
    },
    create: {
      from: event.params.from,
      poolId: event.transaction.source,
      id: event.transaction.hash,
      amounts: event.params.amounts,
      timestamp: event.transaction.timestamp,
    },
  });
};
