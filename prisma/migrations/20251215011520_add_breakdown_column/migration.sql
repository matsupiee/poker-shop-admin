/*
  Warnings:

  - You are about to drop the column `total_amount` on the `settlements` table. All the data in the column will be lost.
  - You are about to drop the column `payment_amount` on the `tournament_chip_events` table. All the data in the column will be lost.
  - You are about to drop the column `discount_amount` on the `visits` table. All the data in the column will be lost.
  - You are about to drop the column `food_amount` on the `visits` table. All the data in the column will be lost.
  - Added the required column `breakdown` to the `settlements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `net_amount` to the `settlements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `charge_amount` to the `tournament_chip_events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ring_game_chip_events" ADD COLUMN     "charge_amount" INTEGER;

-- AlterTable
ALTER TABLE "settlements" DROP COLUMN "total_amount",
ADD COLUMN     "breakdown" JSONB NOT NULL,
ADD COLUMN     "net_amount" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "tournament_chip_events" DROP COLUMN "payment_amount",
ADD COLUMN     "charge_amount" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "visits" DROP COLUMN "discount_amount",
DROP COLUMN "food_amount",
ADD COLUMN     "food_fee" INTEGER;
