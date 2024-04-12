-- CreateTable
CREATE TABLE "Operation" (
    "id" SERIAL NOT NULL,
    "poolTxHash" TEXT NOT NULL,
    "poolAddress" TEXT,
    "routerAddress" TEXT,
    "poolTxLt" TEXT,
    "poolTxTimestamp" TIMESTAMP(3),
    "destinationWalletAddress" TEXT,
    "operationType" TEXT,
    "exitCode" TEXT NOT NULL,
    "asset0Address" TEXT,
    "asset0Amount" TEXT,
    "asset0Delta" TEXT,
    "asset0Reserve" TEXT,
    "asset1Address" TEXT,
    "asset1Amount" TEXT,
    "asset1Delta" TEXT,
    "asset1Reserve" TEXT,
    "lpTokenDelta" TEXT,
    "lpTokenSupply" TEXT,
    "lpFeeAmount" TEXT,
    "protocolFeeAmount" TEXT,
    "referralFeeAmount" TEXT,
    "walletAddress" TEXT,
    "walletTxLt" TEXT,
    "walletTxHash" TEXT,
    "walletTxTimestamp" TIMESTAMP(3),

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Operation_poolTxHash_key" ON "Operation"("poolTxHash");
