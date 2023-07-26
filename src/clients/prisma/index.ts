import { PrismaClient } from "@prisma/client";
import PoolExtensions from "./extensions/pool";
import IndexerStateExtenstions from "./extensions/indexer";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient().$extends(PoolExtensions).$extends(IndexerStateExtenstions);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
