-- AlterTable
ALTER TABLE "Pool" ADD COLUMN     "collectedXProtocolFee" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "collectedYProtocolFee" TEXT NOT NULL DEFAULT '0';
