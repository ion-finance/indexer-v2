-- CreateEnum
CREATE TYPE "PoolType" AS ENUM ('STABLE', 'VOLATILE');

-- CreateTable
CREATE TABLE "Coin" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jettonMinter" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "image" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 9,

    CONSTRAINT "Coin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pool" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "PoolType" NOT NULL DEFAULT 'STABLE',
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "image" TEXT NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "coins" TEXT[],
    "balances" TEXT[],
    "rates" TEXT[],
    "collectedAdminFees" TEXT[],
    "initialA" INTEGER NOT NULL,
    "initialATime" TIMESTAMP(3) NOT NULL,
    "futureA" INTEGER NOT NULL,
    "futureATime" TIMESTAMP(3) NOT NULL,
    "fee" INTEGER NOT NULL,
    "adminFeeRatio" INTEGER NOT NULL,
    "isInitialized" BOOLEAN NOT NULL DEFAULT false,
    "totalSupply" TEXT NOT NULL,
    "dailyAPY" TEXT NOT NULL DEFAULT '0%',
    "weeklyAPY" TEXT NOT NULL DEFAULT '0%',

    CONSTRAINT "Pool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exchange" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp" INTEGER NOT NULL,
    "poolId" TEXT NOT NULL,
    "i" INTEGER NOT NULL,
    "j" INTEGER NOT NULL,
    "amountI" TEXT NOT NULL,
    "amountJ" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,

    CONSTRAINT "Exchange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Burn" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp" INTEGER NOT NULL,
    "poolId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "amounts" TEXT[],

    CONSTRAINT "Burn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mint" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp" INTEGER NOT NULL,
    "poolId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "amounts" TEXT[],

    CONSTRAINT "Mint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexerState" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "IndexerState_pkey" PRIMARY KEY ("key")
);
