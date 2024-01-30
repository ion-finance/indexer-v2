import { Event } from "../../types/events";
import prisma from "../../clients/prisma";
import parseAddLiquidity from "../../parsers/cpmm/parseAddLiquidity";

export const handleAddLiquidity = async (event: Event) => {
  const params = parseAddLiquidity(event.body);
  console.log("Add liquidity event is indexed.");
  console.log(params);
  const { senderAddress, amountX, amountY, minted } = params;
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

  await prisma.deposit.upsert({
    where: {
      id: hash,
      eventId: event.transaction.eventId,
    },
    update: {
      senderAddress: senderAddress,
      receiverAddress: senderAddress,
      poolAddress: source,
      tokenAddress: pool.tokenXAddress, // TODO : In case of cpmm, tokenXAddress is unnecessary.
      amountX,
      amountY,
      timestamp,
    },
    create: {
      id: hash,
      eventId: event.transaction.eventId,
      senderAddress: senderAddress,
      receiverAddress: senderAddress,
      poolAddress: source,
      tokenAddress: pool.tokenXAddress, // TODO : In case of cpmm, tokenXAddress is unnecessary.
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
        amount: (BigInt(lpTokenWallet.amount) + BigInt(minted)).toString(),
      },
    });
  } else {
    await prisma.lpTokenWallet.create({
      data: {
        poolAddress: event.transaction.source,
        ownerAddress: senderAddress,
        amount: minted,
      },
    });
  }
};

export default handleAddLiquidity;
