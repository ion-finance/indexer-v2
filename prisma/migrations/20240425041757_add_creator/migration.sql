/*
  Warnings:

  - Added the required column `creator` to the `Pool` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pool" ADD COLUMN     "creator" TEXT NOT NULL;
