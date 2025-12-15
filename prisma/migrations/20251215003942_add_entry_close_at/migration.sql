/*
  Warnings:

  - Added the required column `entry_closes_at` to the `tournaments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "entry_closes_at" TIMESTAMP(3) NOT NULL;
