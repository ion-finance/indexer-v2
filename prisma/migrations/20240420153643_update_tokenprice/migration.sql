/*
  Warnings:

  - The primary key for the `TokenPrice` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[timestamp,id]` on the table `TokenPrice` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `timestamp` to the `TokenPrice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TokenPrice" DROP CONSTRAINT "TokenPrice_pkey",
ADD COLUMN     "timestamp" TIMESTAMPTZ NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TokenPrice_timestamp_id_key" ON "TokenPrice"("timestamp", "id");
