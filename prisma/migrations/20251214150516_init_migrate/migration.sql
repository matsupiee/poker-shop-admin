-- CreateEnum
CREATE TYPE "TournamentEntrySource" AS ENUM ('BUY_IN', 'FREE', 'SATELLITE');

-- CreateEnum
CREATE TYPE "TournamentChipEventType" AS ENUM ('ENTRY', 'ADD_CHIP');

-- CreateEnum
CREATE TYPE "RingGameChipEventType" AS ENUM ('BUY_IN', 'CASH_OUT');

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "member_id" INTEGER NOT NULL,
    "web_coin_game_id" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_prizes" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "tournament_prizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "player_id" TEXT NOT NULL,
    "visit_date" TIMESTAMP(3) NOT NULL,
    "entrance_fee" INTEGER,
    "food_amount" INTEGER,
    "discount_amount" INTEGER,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_entries" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "visit_id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "entry_source" "TournamentEntrySource" NOT NULL,
    "final_rank" INTEGER,
    "bounty_count" INTEGER,

    CONSTRAINT "tournament_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_chip_events" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tournament_entry_id" TEXT NOT NULL,
    "event_type" "TournamentChipEventType" NOT NULL,
    "chip_amount" INTEGER NOT NULL,
    "payment_amount" INTEGER NOT NULL,

    CONSTRAINT "tournament_chip_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ring_game_entries" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "visit_id" TEXT NOT NULL,

    CONSTRAINT "ring_game_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ring_game_chip_events" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ring_game_entry_id" TEXT NOT NULL,
    "event_type" "RingGameChipEventType" NOT NULL,
    "chip_amount" INTEGER NOT NULL,

    CONSTRAINT "ring_game_chip_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "visit_id" TEXT NOT NULL,
    "total_amount" INTEGER NOT NULL,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_coins" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "player_id" TEXT NOT NULL,
    "balance" INTEGER NOT NULL,

    CONSTRAINT "store_coins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_member_id_key" ON "players"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_web_coin_game_id_key" ON "players"("web_coin_game_id");

-- CreateIndex
CREATE UNIQUE INDEX "ring_game_entries_visit_id_key" ON "ring_game_entries"("visit_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_coins_player_id_key" ON "store_coins"("player_id");

-- AddForeignKey
ALTER TABLE "tournament_prizes" ADD CONSTRAINT "tournament_prizes_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
