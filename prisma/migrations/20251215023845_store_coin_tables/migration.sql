/*
  Warnings:

  - You are about to drop the `store_coins` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "store_coins" DROP CONSTRAINT "store_coins_player_id_fkey";

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "store_coin_balance" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "store_coins";

-- CreateTable
CREATE TABLE "store_coin_deposits" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "player_id" TEXT NOT NULL,
    "deposit_amount" INTEGER NOT NULL,

    CONSTRAINT "store_coin_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_coin_withdraw_amount" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "store_coin_deposit_id" TEXT NOT NULL,
    "store_coin_withdraw_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "store_coin_withdraw_amount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proceeds_withdraw" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "player_id" TEXT NOT NULL,
    "withdraw_amount" INTEGER NOT NULL,

    CONSTRAINT "proceeds_withdraw_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "store_coin_deposits" ADD CONSTRAINT "store_coin_deposits_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_coin_withdraw_amount" ADD CONSTRAINT "store_coin_withdraw_amount_store_coin_deposit_id_fkey" FOREIGN KEY ("store_coin_deposit_id") REFERENCES "store_coin_deposits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_coin_withdraw_amount" ADD CONSTRAINT "store_coin_withdraw_amount_store_coin_withdraw_id_fkey" FOREIGN KEY ("store_coin_withdraw_id") REFERENCES "proceeds_withdraw"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proceeds_withdraw" ADD CONSTRAINT "proceeds_withdraw_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
