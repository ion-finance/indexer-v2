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

  const transactions = [
    ...deposit.map((t) => ({ ...t, type: "add" })),
    ...withdraw.map((t) => ({ ...t, type: "remove" })),
    ...swap.map((t) => ({ ...t, type: "swap" })),
    ...orderHistory.map((t) => ({ ...t, type: "order" })),
  ];

  return res.json({
    // TODO
    // 1. pagenation
    data: _.orderBy(
      _.values(_.groupBy(transactions, "eventId")).map((txs) => {
        const first = _.orderBy(txs, "timestamp", "asc")[0];

        return {
          ...first,
          children: txs.filter((tx) => tx.id !== first.id),
        };
      }),
      "timestamp",
      "desc"
    ),
  });
});

export default router;
