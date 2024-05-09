-- AlterTable
ALTER TABLE "IndexerState" ADD COLUMN     "lastEventId" TEXT NOT NULL DEFAULT '0x',
ADD COLUMN     "totalEventsCount" INTEGER NOT NULL DEFAULT 0;
