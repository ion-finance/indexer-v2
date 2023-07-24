import { PrismaClient } from "@prisma/client";
import PoolExtensions from "./extensions/pool";
import IndexerStateExtenstions from "./extensions/indexer";

const prisma = new PrismaClient()
  .$extends(PoolExtensions)
  .$extends(IndexerStateExtenstions);

export default prisma;
