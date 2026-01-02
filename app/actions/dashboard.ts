"use server";

import { prisma } from "@/lib/prisma";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  startOfDay,
  endOfDay,
} from "date-fns";

export type DailyStat = {
  date: string;
  dayOfWeek: string; // 'Mon', 'Tue' etc
  visitors: number;
  tournaments: number;
  tournamentEntries: number;
  ringGameEntries: number;
  grossProfit: number;
};

export async function getDashboardStats(
  monthStr: string
): Promise<DailyStat[]> {
  // monthStr is expected to be "YYYY-MM"
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(year, month - 1);

  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 1. Visits (with RingGame and Fees)
  const visits = await prisma.visit.findMany({
    where: {
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    include: {
      webCoinRingEntry: {
        include: {
          webCoinRingChipEvents: true,
        },
      },
      inStoreRingEntry: {
        include: {
          inStoreRingChipEvents: true,
        },
      },
    },
  });

  // 2. Tournaments (with Entries and Prizes)
  const tournaments = await prisma.tournament.findMany({
    where: {
      startAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    include: {
      entries: {
        include: {
          tournamentChipEvents: true,
        },
      },
      tournamentPrizes: true,
    },
  });

  const stats: DailyStat[] = days.map((day) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    // Filter for this day
    const dayVisits = visits.filter(
      (v) => v.createdAt >= dayStart && v.createdAt <= dayEnd
    );
    const dayTournaments = tournaments.filter(
      (t) => t.startAt >= dayStart && t.startAt <= dayEnd
    );

    // Stats
    const visitors = dayVisits.length;
    const tournamentCount = dayTournaments.length;

    // Tournament Participants (Entries in today's tournaments)
    const tournamentEntriesCount = dayTournaments.reduce(
      (sum, t) => sum + t.entries.length,
      0
    );

    // Ring Game Participants (Visits today that have a ring game entry)
    const ringGameEntriesCount = dayVisits.filter(
      (v) => !!v.webCoinRingEntry || !!v.inStoreRingEntry
    ).length;

    // Profit Calculation
    let profit = 0;

    // + Visit Fees
    dayVisits.forEach((v) => {
      profit += v.entranceFee || 0;
      profit += v.foodFee || 0;
    });

    // Ring Game
    dayVisits.forEach((v) => {
      if (v.webCoinRingEntry) {
        v.webCoinRingEntry.webCoinRingChipEvents.forEach((e) => {
          if (e.eventType === "BUY_IN") {
            profit += e.chipAmount;
          } else if (e.eventType === "CASH_OUT") {
            profit -= e.chipAmount;
          }
        });
      }
      if (v.inStoreRingEntry) {
        v.inStoreRingEntry.inStoreRingChipEvents.forEach((e) => {
          if (e.eventType === "BUY_IN") {
            profit += e.chipAmount;
          } else if (e.eventType === "CASH_OUT") {
            profit -= e.chipAmount;
          }
        });
      }
    });

    // Tournaments
    dayTournaments.forEach((t) => {
      // + Entry Fees (Income)
      t.entries.forEach((entry) => {
        entry.tournamentChipEvents.forEach((e) => {
          profit += e.chargeAmount;
        });

        // - Prizes (Expense)
        if (entry.finalRank) {
          const prize = t.tournamentPrizes.find(
            (p) => p.rank === entry.finalRank
          );
          if (prize) {
            profit -= prize.amount;
          }
        }
      });
    });

    return {
      date: format(day, "yyyy-MM-dd"),
      dayOfWeek: format(day, "EEE"),
      visitors,
      tournaments: tournamentCount,
      tournamentEntries: tournamentEntriesCount,
      ringGameEntries: ringGameEntriesCount,
      grossProfit: profit,
    };
  });

  return stats;
}
