/*
  Warnings:

  - You are about to drop the column `eventId` on the `Deposit` table. All the data in the column will be lost.
  - You are about to drop the column `walletTxHash` on the `Operation` table. All the data in the column will be lost.
  - You are about to drop the column `walletTxLt` on the `Operation` table. All the data in the column will be lost.
  - You are about to drop the column `walletTxTimestamp` on the `Operation` table. All the data in the column will be lost.
  - You are about to drop the column `eventId` on the `Swap` table. All the data in the column will be lost.
  - You are about to drop the column `eventId` on the `Withdraw` table. All the data in the column will be lost.
  - Added the required column `hash` to the `Deposit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hash` to the `Swap` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hash` to the `Withdraw` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Deposit" DROP COLUMN "eventId",
ADD COLUMN     "hash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Operation" DROP COLUMN "walletTxHash",
DROP COLUMN "walletTxLt",
DROP COLUMN "walletTxTimestamp";

-- AlterTable
ALTER TABLE "Swap" DROP COLUMN "eventId",
ADD COLUMN     "hash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Withdraw" DROP COLUMN "eventId",
ADD COLUMN     "hash" TEXT NOT NULL;
