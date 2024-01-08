import { Router } from "express";
import prisma from "../../../clients/prisma";
import { Prisma } from "@prisma/client";
import { orderBy } from "lodash";

const router = Router();

router.get("/orders", async function handler(req, res) {
  const { poolAddress, ownerAddress } = req.query;

  const query = {} as Prisma.OrderWhereInput;

  if (!poolAddress && !ownerAddress) {
    return res.json({
      status: "bad request",
      data: [],
    });
  }

  if (poolAddress) {
    query.poolAddress = poolAddress as string;
  }
  if (ownerAddress) {
    query.ownerAddress = ownerAddress as string;
  }

  const orders = await prisma.order.findMany({ where: query });
  const sorted = orderBy(orders, ["timestamp"], ["desc"]);

  return res.json({
    // TODO
    // 1. pagenation
    data: sorted,
  });
});

export default router;
