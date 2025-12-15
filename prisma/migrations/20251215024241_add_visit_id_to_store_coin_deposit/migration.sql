/*
  Warnings:

  - A unique constraint covering the columns `[visit_id]` on the table `store_coin_deposits` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "store_coin_deposits" ADD COLUMN     "visit_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "store_coin_deposits_visit_id_key" ON "store_coin_deposits"("visit_id");

-- AddForeignKey
ALTER TABLE "store_coin_deposits" ADD CONSTRAINT "store_coin_deposits_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
