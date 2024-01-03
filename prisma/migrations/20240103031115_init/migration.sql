-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('PLACED', 'CANCLLED', 'EXECUTED', 'CLAIMED');

-- CreateTable
CREATE TABLE "Pool" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "tokenXAddress" TEXT NOT NULL,
    "tokenYAddress" TEXT NOT NULL,
    "binStep" INTEGER NOT NULL,
    "activeBinId" INTEGER NOT NULL,

    CONSTRAINT "Pool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jettonMinterAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bins" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "binId" INTEGER NOT NULL,
    "poolAddress" TEXT NOT NULL,
    "reserveX" TEXT NOT NULL,
    "reserveY" TEXT NOT NULL,

    CONSTRAINT "Bins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositedToBins" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp" INTEGER NOT NULL,
    "poolAddress" TEXT NOT NULL,
    "senderAddress" TEXT NOT NULL,
    "receiverAddress" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "deposited" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "DepositedToBins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawnFromBins" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp" INTEGER NOT NULL,
    "poolAddress" TEXT NOT NULL,
    "senderAddress" TEXT NOT NULL,
    "receiverAddress" TEXT NOT NULL,
    "withdrawn" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "WithdrawnFromBins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Swap" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp" INTEGER NOT NULL,
    "poolAddress" TEXT NOT NULL,
    "senderAddress" TEXT NOT NULL,
    "receiverAddress" TEXT NOT NULL,
    "amountIn" TEXT NOT NULL,
    "amountOut" TEXT NOT NULL,
    "swapForY" BOOLEAN NOT NULL,
    "activeBinId" INTEGER NOT NULL,

    CONSTRAINT "Swap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferBatch" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp" INTEGER NOT NULL,
    "poolAddress" TEXT NOT NULL,
    "senderAddress" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "amounts" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "TransferBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LpTokenWallet" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "poolAddress" TEXT NOT NULL,
    "ownerAddress" TEXT NOT NULL,
    "shares" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "LpTokenWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderHistory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp" INTEGER NOT NULL,
    "poolAddress" TEXT NOT NULL,
    "senderAddress" TEXT NOT NULL,
    "relatedOwnerAddres" TEXT,
    "binId" INTEGER NOT NULL,
    "orderForY" BOOLEAN NOT NULL,
    "positionId" INTEGER NOT NULL,
    "amountX" TEXT NOT NULL,
    "amountY" TEXT NOT NULL,
    "orderType" "OrderType" NOT NULL,

    CONSTRAINT "OrderHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp" INTEGER NOT NULL,
    "poolAddress" TEXT NOT NULL,
    "ownerAddress" TEXT NOT NULL,
    "binId" INTEGER NOT NULL,
    "positionId" INTEGER NOT NULL,
    "amountX" TEXT NOT NULL DEFAULT '0',
    "amountY" TEXT NOT NULL DEFAULT '0',
    "status" "OrderType" NOT NULL DEFAULT 'PLACED',

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexerState" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "IndexerState_pkey" PRIMARY KEY ("key")
);
