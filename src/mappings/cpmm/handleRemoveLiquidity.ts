import { Event } from "../../types/events";
import prisma from "../../clients/prisma";
import parseRemoveLiquidity from "../../parsers/cpmm/parseRemoveLiquidity";

export const handleAddLiquidity = async (event: Event) => {
  const params = parseRemoveLiquidity(event.body);
  console.log("Remove liquidity event is indexed.");
  console.log(event);
  const { from, amountX, amountY, burned } = params;
  const { hash, source, timestamp } = event.transaction;
  const pool = await prisma.pool.findFirst({
    where: {
      id: source,
    },
  });

  if (!pool) {
    console.log("Pool not found.");
    return;
  }

  await prisma.withdraw.upsert({
    where: {
      id: hash,
      eventId: event.transaction.eventId,
    },
    update: {
      senderAddress: from,
      receiverAddress: from,
      poolAddress: source,
      amountX,
      amountY,
      timestamp,
    },
    create: {
      id: hash,
      eventId: event.transaction.eventId,
      senderAddress: from,
      receiverAddress: from,
      poolAddress: source,
      amountX,
      amountY,
      timestamp,
    },
  });

  // TODO : LpWallet
};

export default handleAddLiquidity;
