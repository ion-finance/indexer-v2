/*
  Warnings:

  - You are about to drop the column `lastEventId` on the `IndexerState` table. All the data in the column will be lost.
  - You are about to drop the column `totalEventsCount` on the `IndexerState` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `IndexerState` table. All the data in the column will be lost.
  - Added the required column `toLt` to the `IndexerState` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "IndexerState" DROP COLUMN "lastEventId",
DROP COLUMN "totalEventsCount",
DROP COLUMN "value",
ADD COLUMN     "toLt" TEXT NOT NULL,
ADD COLUMN     "totalTransactionsCount" INTEGER NOT NULL DEFAULT 0;
