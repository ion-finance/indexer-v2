import { PrismaClient } from "@prisma/client";
import PoolExtensions from "./extensions/pool";
import IndexerStateExtenstions from "./extensions/indexer";

const extendedPrismaClient = () => {
  const prisma = new PrismaClient();

  const extendedPrisma = prisma
    .$extends(PoolExtensions)
    .$extends(IndexerStateExtenstions);

  return extendedPrisma;
};

export type ExtendedPrismaClient = ReturnType<typeof extendedPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient;
};

const prisma = globalForPrisma.prisma || extendedPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
