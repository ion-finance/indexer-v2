import { Event } from "../../types/events";
import prisma from "../../clients/prisma";
import parseRemoveLiquidity from "../../parsers/cpmm/parseRemoveLiquidity";

export const handleRemoveLiquidity = async (event: Event) => {
  const params = parseRemoveLiquidity(event.body);
  console.log("Remove liquidity event is indexed.");
  console.log(params);
  const { senderAddress, amountX, amountY, burned } = params;
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
    update: {},
    create: {
      id: hash,
      eventId: event.transaction.eventId,
      senderAddress,
      receiverAddress: senderAddress,
      poolAddress: source,
      amountX,
      amountY,
      timestamp,
    },
  });

  const lpTokenWallet = await prisma.lpTokenWallet.findFirst({
    where: {
      poolAddress: event.transaction.source,
      ownerAddress: senderAddress,
    },
  });

  if (lpTokenWallet) {
    await prisma.lpTokenWallet.update({
      where: {
        id: lpTokenWallet.id,
      },
      data: {
        amount: (BigInt(lpTokenWallet.amount) - BigInt(burned)).toString(),
      },
    });
  } else {
    await prisma.lpTokenWallet.create({
      data: {
        poolAddress: event.transaction.source,
        ownerAddress: senderAddress,
        amount: "0",
      },
    });
  }
};

export default handleRemoveLiquidity;
