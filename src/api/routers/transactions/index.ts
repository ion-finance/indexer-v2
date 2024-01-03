import { Router } from "express";
import prisma from "../../../clients/prisma";
import { Prisma } from "@prisma/client";
import _ from "lodash";

const router = Router();

router.get("/transactions", async function handler(req, res) {
  const { poolAddress, senderAddress, type } = req.query;

  const query = {} as { poolAddress?: string; senderAddress?: string };
  let orderQuery = {} as Prisma.OrderHistoryWhereInput;
  prisma.orderHistory;

  if (!poolAddress && !senderAddress) {
    return res.json({
      status: "bad request",
      data: [],
    });
  }

  if (poolAddress) {
    query.poolAddress = poolAddress as string;
    orderQuery.poolAddress = poolAddress as string;
  }
  if (senderAddress) {
    query.senderAddress = senderAddress as string;
    orderQuery = {
      ...orderQuery,
      AND: {
        OR: [
          { senderAddress: senderAddress as string },
          { relatedOwnerAddres: { contains: senderAddress as string } },
        ],
      },
    };
  }

  const [deposit, withdraw, swap, orderHistory] = await Promise.all([
    !type || type === "deposit"
      ? prisma.depositedToBins.findMany({ where: query })
      : [],
    !type || type === "withdraw"
      ? prisma.withdrawnFromBins.findMany({ where: query })
      : [],
    !type || type === "swap" ? prisma.swap.findMany({ where: query }) : [],
    !type || type === "order"
      ? prisma.orderHistory.findMany({
          where: orderQuery,
        })
      : [],
  ]);

  const transactions = _.sortBy(
    [
      ...deposit.map((t) => ({ ...t, type: "add" })),
      ...withdraw.map((t) => ({ ...t, type: "remove" })),
      ...swap.map((t) => ({ ...t, type: "swap" })),
      ...orderHistory.map((t) => ({ ...t, type: "order" })),
    ],
    "timestamp"
  );

  return res.json({
    // TODO
    // 1. pagenation
    data: transactions,
  });
});

export default router;
