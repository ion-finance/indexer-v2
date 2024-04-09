-- CreateTable
CREATE TABLE "TokenPrice" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tokenSymbol" TEXT NOT NULL,
    "price" TEXT NOT NULL,

    CONSTRAINT "TokenPrice_pkey" PRIMARY KEY ("id")
);
