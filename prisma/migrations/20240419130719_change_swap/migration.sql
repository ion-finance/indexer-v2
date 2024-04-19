/*
  Warnings:

  - Added the required column `receiveTokenAddress` to the `Swap` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sendTokenAddress` to the `Swap` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Swap" ADD COLUMN     "receiveTokenAddress" TEXT NOT NULL,
ADD COLUMN     "sendTokenAddress" TEXT NOT NULL;
