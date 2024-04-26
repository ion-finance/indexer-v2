/*
  Warnings:

  - A unique constraint covering the columns `[poolAddress,binId]` on the table `Bins` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Bins_poolAddress_binId_key" ON "Bins"("poolAddress", "binId");
