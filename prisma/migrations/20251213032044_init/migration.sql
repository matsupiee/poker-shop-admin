-- CreateEnum
CREATE TYPE "TournamentChipEventType" AS ENUM ('ENTRY', 'REENTRY', 'ADD-ON');

-- CreateEnum
CREATE TYPE "RingGameChipEventType" AS ENUM ('BUY_IN', 'CASH_OUT');

-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "member_id" TEXT NOT NULL,
    "game_id" TEXT,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "visit_date" TIMESTAMP(3) NOT NULL,
    "entrance_fee" INTEGER,
    "food_amount" INTEGER,
    "discount_amount" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_entries" (
    "id" SERIAL NOT NULL,
    "visit_id" INTEGER NOT NULL,
    "tournament_id" INTEGER NOT NULL,
    "final_rank" INTEGER,
    "bounty_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_chip_events" (
    "id" SERIAL NOT NULL,
    "tournament_entry_id" INTEGER NOT NULL,
    "event_type" "TournamentChipEventType" NOT NULL,
    "chip_amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_chip_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ring_game_entries" (
    "id" SERIAL NOT NULL,
    "visit_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ring_game_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ring_game_chip_events" (
    "id" SERIAL NOT NULL,
    "ring_game_entry_id" INTEGER NOT NULL,
    "event_type" "RingGameChipEventType" NOT NULL,
    "chip_amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ring_game_chip_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" SERIAL NOT NULL,
    "visit_id" INTEGER NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_coins" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,

    CONSTRAINT "store_coins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_member_id_key" ON "players"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_entries_visit_id_tournament_id_key" ON "tournament_entries"("visit_id", "tournament_id");

-- CreateIndex
CREATE UNIQUE INDEX "ring_game_entries_visit_id_key" ON "ring_game_entries"("visit_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_coins_player_id_key" ON "store_coins"("player_id");

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_chip_events" ADD CONSTRAINT "tournament_chip_events_tournament_entry_id_fkey" FOREIGN KEY ("tournament_entry_id") REFERENCES "tournament_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ring_game_entries" ADD CONSTRAINT "ring_game_entries_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ring_game_chip_events" ADD CONSTRAINT "ring_game_chip_events_ring_game_entry_id_fkey" FOREIGN KEY ("ring_game_entry_id") REFERENCES "ring_game_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_coins" ADD CONSTRAINT "store_coins_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
