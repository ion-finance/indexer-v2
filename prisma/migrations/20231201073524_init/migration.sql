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
CREATE TABLE "Bins" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "binId" TEXT NOT NULL,
    "poolAddress" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "reserve" TEXT NOT NULL,

    CONSTRAINT "Bins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexerState" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "IndexerState_pkey" PRIMARY KEY ("key")
);
