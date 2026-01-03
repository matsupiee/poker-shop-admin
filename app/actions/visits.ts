"use server";

import { prisma } from "@/lib/prisma";
import { calcFinalNetAmount, calcTax } from "@/lib/settlement/calc";
import {
  IN_STORE_WITHDRAW_FEE,
  WEB_COIN_PER_CHIP,
} from "@/lib/settlement/const";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import {
  depositWebCoinWhenCheckout,
  withdrawWebCoinTransaction,
} from "./web-coin";
import { SettlementItemType } from "@/lib/generated/prisma/client";
import { depositInStoreChipWhenCheckout } from "./in-store-chip";

export type TournamentEventInfo = {
  eventId: string;
  entryId: string;
  tournamentName: string;
  tournamentId: string;
  eventType: "ENTRY" | "ADD_CHIP";
  chipAmount: number;
  chargeAmount: number;
  status: "playing" | "eliminated" | "finished";
  rank?: number;
  bountyCount?: number;
  hasBounty: boolean;
  timestamp: string;
  isLatestEntry: boolean;
};

export type RingGameChipEventInfo = {
  eventType: string;
  chipAmount: number;
  timestamp: string;
};

export type RingGameInfo = {
  id: string;
  joined: boolean;
  currentStatus: "playing" | "left";
  totalBuyIn: number;
  totalCashOut: number;
  timeline: RingGameChipEventInfo[];
  ringGameType?: "WEB_COIN" | "IN_STORE";
};

export type DailyVisit = {
  id: string;
  visitDate: string;
  checkInTime: string;
  player: {
    id: string;
    memberId: string;
    name: string;
    image?: string;
    webCoinBalance: number;
    inStoreChipBalance: number;
  };
  tournaments: TournamentEventInfo[];
  ringGameEntries: RingGameInfo[];
  settlement: {
    id: string;
    netAmount: number;
    createdAt: Date;
    webCoinWithdraw: {
      id: string;
      withdrawAmount: number;
    } | null;
  } | null;
};

export async function getDailyVisits(date: Date): Promise<DailyVisit[]> {
  // Set time range for the selected date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const visits = await prisma.visit.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      player: true,
      tournamentEntries: {
        include: {
          tournament: {
            include: {
              tournamentBounty: true,
            },
          },
          tournamentChipEvents: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      webCoinRingEntry: {
        include: {
          webCoinRingChipEvents: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
      inStoreRingEntry: {
        include: {
          inStoreRingChipEvents: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
      settlement: {
        include: {
          webCoinWithdraw: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return visits.map((visit) => {
    // Group entries by tournament to find the latest one for each tournament
    const entriesByTournament = visit.tournamentEntries.reduce(
      (acc, entry) => {
        if (!acc[entry.tournamentId]) {
          acc[entry.tournamentId] = [];
        }
        acc[entry.tournamentId].push(entry);
        return acc;
      },
      {} as Record<string, typeof visit.tournamentEntries>
    );

    // Map tournaments to a flat list of chip events
    const tournaments: TournamentEventInfo[] = visit.tournamentEntries.flatMap(
      (entry) => {
        // Determine status
        let status: "playing" | "eliminated" | "finished" = "playing";
        if (entry.finalRank) {
          status = "eliminated";
        }

        // Check if this is the latest entry for this tournament in this visit
        const entries = entriesByTournament[entry.tournamentId];
        const latestEntry = entries[entries.length - 1];
        const isLatestEntry = entry.id === latestEntry.id;

        return entry.tournamentChipEvents.map((event) => ({
          eventId: event.id,
          entryId: entry.id,
          tournamentName: entry.tournament.name,
          tournamentId: entry.tournament.id,
          eventType: event.eventType as "ENTRY" | "ADD_CHIP",
          chipAmount: event.chipAmount,
          chargeAmount: event.chargeAmount,
          status,
          rank: entry.finalRank ?? undefined,
          bountyCount: entry.bountyCount ?? undefined,
          hasBounty: !!entry.tournament.tournamentBounty,
          timestamp: format(event.createdAt, "HH:mm"),
          isLatestEntry,
        }));
      }
    );

    // Map ring games
    const ringGames: RingGameInfo[] = [];

    if (visit.webCoinRingEntry) {
      const entry = visit.webCoinRingEntry;
      const buyIn = entry.webCoinRingChipEvents
        .filter((e) => e.eventType === "BUY_IN")
        .reduce((sum, e) => sum + e.chipAmount, 0);

      const cashOut = entry.webCoinRingChipEvents
        .filter((e) => e.eventType === "CASH_OUT")
        .reduce((sum, e) => sum + e.chipAmount, 0);

      const status = cashOut > 0 ? "left" : "playing";

      const timeline: RingGameChipEventInfo[] = entry.webCoinRingChipEvents.map(
        (e) => ({
          eventType: e.eventType,
          chipAmount: e.chipAmount,
          timestamp: format(e.createdAt, "HH:mm"),
        })
      );

      ringGames.push({
        id: entry.id,
        joined: true,
        currentStatus: status,
        totalBuyIn: buyIn,
        totalCashOut: cashOut,
        timeline,
        ringGameType: "WEB_COIN",
      });
    }

    if (visit.inStoreRingEntry) {
      const entry = visit.inStoreRingEntry;
      const buyIn = entry.inStoreRingChipEvents
        .filter((e) => e.eventType === "BUY_IN")
        .reduce((sum, e) => sum + e.chipAmount, 0);

      const cashOut = entry.inStoreRingChipEvents
        .filter((e) => e.eventType === "CASH_OUT")
        .reduce((sum, e) => sum + e.chipAmount, 0);

      const status = cashOut > 0 ? "left" : "playing";

      const timeline: RingGameChipEventInfo[] = entry.inStoreRingChipEvents.map(
        (e) => ({
          eventType: e.eventType,
          chipAmount: e.chipAmount,
          timestamp: format(e.createdAt, "HH:mm"),
        })
      );

      ringGames.push({
        id: entry.id,
        joined: true,
        currentStatus: status,
        totalBuyIn: buyIn,
        totalCashOut: cashOut,
        timeline,
        ringGameType: "IN_STORE",
      });
    }

    return {
      id: visit.id.toString(),
      visitDate: visit.createdAt.toISOString().split("T")[0],
      checkInTime: format(visit.createdAt, "HH:mm"),
      player: {
        id: visit.player.id.toString(),
        memberId: visit.player.memberId,
        name: visit.player.name,
        webCoinBalance: visit.player.webCoinBalance,
        inStoreChipBalance: visit.player.inStoreChipBalance,
        // image: visit.player.image // Add if available in schema later
      },
      tournaments,
      ringGameEntries: ringGames,
      settlement: visit.settlement,
    };
  });
}

export type RegisterVisitState = {
  errors?: {
    playerId?: string[];
    visitDate?: string[];
    entranceFee?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function registerVisit(
  _: RegisterVisitState,
  formData: FormData
): Promise<RegisterVisitState> {
  const playerId = formData.get("playerId") as string;
  const entranceFeeStr = formData.get("entranceFee") as string;

  const errors: RegisterVisitState["errors"] = {};

  if (!playerId) {
    errors.playerId = ["プレイヤーが選択されていません"];
  }

  let entranceFee: number | null = null;
  if (entranceFeeStr && entranceFeeStr.trim() !== "") {
    const fee = parseInt(entranceFeeStr);
    if (isNaN(fee) || fee < 0) {
      errors.entranceFee = ["入場料は0以上の数値を入力してください"];
    } else {
      entranceFee = fee;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const existing = await prisma.visit.findFirst({
      where: {
        playerId: playerId,
      },
      include: {
        settlement: true,
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });

    // Only block if there's an existing visit without settlement
    if (existing && existing.settlement) {
      return {
        errors: {
          _form: [
            "このプレイヤーの前回の来店の決済が完了していません。決済を完了させてください",
          ],
        },
      };
    }

    await prisma.visit.create({
      data: {
        playerId: playerId,
        entranceFee: entranceFee,
      },
    });

    revalidatePath("/players");
    revalidatePath("/daily-visits");

    return { success: true };
  } catch (e) {
    console.error(e);
    return {
      errors: {
        _form: ["来店登録に失敗しました。時間をおいて再度お試しください。"],
      },
    };
  }
}

export async function updateTournamentResult(
  entryId: string,
  inputRank?: number,
  inputBountyCount?: number
) {
  try {
    const entry = await prisma.tournamentEntry.findUnique({
      where: { id: entryId },
      include: {
        visit: true,
        tournament: {
          include: {
            tournamentPrizes: true,
            tournamentBounty: true,
          },
        },
      },
    });
    if (!entry) {
      return { success: false, error: "Entry not found" };
    }

    // Check if this is the latest entry for the player in this tournament
    const latestEntry = await prisma.tournamentEntry.findFirst({
      where: {
        tournamentId: entry.tournamentId,
        visit: {
          playerId: entry.visit.playerId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (latestEntry && latestEntry.id !== entry.id) {
      return {
        success: false,
        error: "最新のエントリー以外には結果を記録できません",
      };
    }

    // Calculate prize amount
    let prizeAmount = 0;

    const rank = inputRank ?? entry.finalRank;
    const bountyCount = inputBountyCount ?? entry.bountyCount;

    // Add rank prize if applicable
    if (rank) {
      const prize = entry.tournament.tournamentPrizes.find(
        (p) => p.rank === rank
      );
      if (prize) {
        prizeAmount += prize.amount;
      }
    }

    // Add bounty prize if applicable
    if (bountyCount && bountyCount > 0 && entry.tournament.tournamentBounty) {
      const bountyPerKill =
        entry.tournament.tournamentBounty.totalAmount /
        entry.tournament.tournamentBounty.ticketCount;
      prizeAmount += bountyPerKill * bountyCount;
    }

    await prisma.tournamentEntry.update({
      where: { id: entryId },
      data: {
        finalRank: rank,
        bountyCount: bountyCount,
        prizeAmount: prizeAmount > 0 ? prizeAmount : null,
      },
    });
    revalidatePath("/daily-visits");
    return { success: true };
  } catch (error) {
    console.error("Failed to update tournament result", error);
    return { success: false, error: "結果の更新に失敗しました" };
  }
}

async function getVisitTournamentResult(visitId: string) {
  const tournamentEntries = await prisma.tournamentEntry.findMany({
    where: {
      visitId: visitId,
    },
    include: {
      tournamentChipEvents: true,
    },
  });
  const chipEvents = tournamentEntries.flatMap((e) => e.tournamentChipEvents);
  const totalChargeAmount = chipEvents.reduce(
    (total, event) => total + event.chargeAmount,
    0
  );
  const totalPrizeAmount = tournamentEntries.reduce(
    (total, entry) => total + (entry.prizeAmount ?? 0),
    0
  );
  return {
    totalChargeAmount,
    totalPrizeAmount,
  };
}

async function getVisitWebCoinRingNet(visitId: string) {
  const webCoinRingEntry = await prisma.webCoinRingEntry.findUnique({
    where: { visitId: visitId },
    include: {
      webCoinRingChipEvents: true,
    },
  });
  if (!webCoinRingEntry) {
    return {
      totalBuyIn: 0,
      totalCashOut: 0,
    };
  }

  const chipEvents = webCoinRingEntry.webCoinRingChipEvents;

  const totalBuyInChip = chipEvents.reduce(
    (total, event) =>
      total + (event.eventType === "BUY_IN" ? event.chipAmount : 0),
    0
  );
  const totalCashOutChip = chipEvents.reduce(
    (total, event) =>
      total + (event.eventType === "CASH_OUT" ? event.chipAmount : 0),
    0
  );

  return {
    totalBuyIn: totalBuyInChip * WEB_COIN_PER_CHIP,
    totalCashOut: totalCashOutChip * WEB_COIN_PER_CHIP,
  };
}

async function getVisitInStoreRingFee(visitId: string) {
  const inStoreRingEntry = await prisma.inStoreRingEntry.findUnique({
    where: { visitId: visitId },
    include: {
      inStoreRingChipEvents: true,
    },
  });
  if (!inStoreRingEntry) {
    return {
      totalBuyInFee: 0,
      withdrawFee: 0,
    };
  }

  const inStoreRingOptions = await prisma.inStoreRingBuyInOption.findMany();
  const inStoreRingTotalBuyInFee = inStoreRingEntry.inStoreRingChipEvents
    .filter((e) => e.eventType === "BUY_IN")
    .reduce((total, event) => {
      const option = inStoreRingOptions.find(
        (o) => o.chipAmount === event.chipAmount
      );
      return total + (option?.chargeAmount ?? 0);
    }, 0);
  const isWithdraw = inStoreRingEntry.inStoreRingChipEvents.some(
    (e) => e.eventType === "WITHDRAW"
  );

  return {
    totalBuyInFee: inStoreRingTotalBuyInFee,
    withdrawFee: isWithdraw ? IN_STORE_WITHDRAW_FEE : 0,
  };
}

export type VisitSettlementDetails = {
  tournament: {
    totalChargeAmount: number;
    totalPrizeAmount: number;
  };
  webCoinRing: {
    totalBuyIn: number;
    totalCashOut: number;
  };
  inStoreRing: {
    totalBuyInFee: number;
    withdrawFee: number;
  };
};

export async function getVisitSettlementDetails(
  visitId: string
): Promise<VisitSettlementDetails> {
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      inStoreChipDeposit: true,
    },
  });

  if (!visit) {
    throw new Error("来店データが見つかりません");
  }

  const tournament = await getVisitTournamentResult(visitId);
  const webCoinRing = await getVisitWebCoinRingNet(visitId);
  const inStoreRing = await getVisitInStoreRingFee(visitId);

  return {
    tournament,
    webCoinRing,
    inStoreRing,
  };
}

export async function settleVisit(input: {
  visitId: string;
  depositToSavings: boolean;
  webCoinWithdrawAmount: number;
}) {
  const { visitId, depositToSavings, webCoinWithdrawAmount } = input;

  try {
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: { player: true },
    });

    if (!visit) {
      throw new Error("来店データが見つかりません");
    }

    if (
      webCoinWithdrawAmount > 0 &&
      webCoinWithdrawAmount > visit.player.webCoinBalance
    ) {
      throw new Error("web貯金コイン残高が不足しています");
    }

    const existingSettlement = await prisma.settlement.findFirst({
      where: { visitId },
    });

    if (existingSettlement) {
      throw new Error("既に決済が完了しています");
    }

    const visitSettlementDetails = await getVisitSettlementDetails(visitId);
    const { consumptionTax } = calcTax({
      visitSettlementDetails,
      webCoinWithdrawAmount,
    });

    const finalNetAmount = calcFinalNetAmount({
      visitSettlementDetails,
      webCoinWithdrawAmount,
      consumptionTax,
    });

    await prisma.$transaction(async (ptx) => {
      const withdraw =
        webCoinWithdrawAmount > 0
          ? await withdrawWebCoinTransaction({
              playerId: visit.player.id,
              amount: webCoinWithdrawAmount,
              currentBalance: visit.player.webCoinBalance,
              ptx,
            })
          : null;

      await ptx.settlement.create({
        data: {
          visitId,
          netAmount: finalNetAmount,
          webCoinWithdrawId: withdraw?.id,
          settlementItems: {
            create: [
              {
                settlementItemType:
                  SettlementItemType.WEB_COIN_RING_TOTAL_CASH_OUT,
                amount: visitSettlementDetails.webCoinRing.totalCashOut,
              },
              {
                settlementItemType:
                  SettlementItemType.WEB_COIN_RING_TOTAL_BUY_IN,
                amount: visitSettlementDetails.webCoinRing.totalBuyIn,
              },
              {
                settlementItemType: SettlementItemType.TOURNAMENT_TOTAL_CHARGE,
                amount: visitSettlementDetails.tournament.totalChargeAmount,
              },
              {
                settlementItemType: SettlementItemType.TOURNAMENT_TOTAL_PRIZE,
                amount: visitSettlementDetails.tournament.totalPrizeAmount,
              },
              {
                settlementItemType:
                  SettlementItemType.IN_STORE_CHIP_WITHDRAW_FEE,
                amount: visitSettlementDetails.inStoreRing.withdrawFee,
              },
              {
                settlementItemType: SettlementItemType.IN_STORE_CHIP_BUY_IN_FEE,
                amount: visitSettlementDetails.inStoreRing.totalBuyInFee,
              },
              // 消費税
              {
                settlementItemType: SettlementItemType.CONSUMPTION_TAX,
                amount: consumptionTax,
              },
              // webコイン 引き出し
              {
                settlementItemType: SettlementItemType.WEB_COIN_WITHDRAW,
                amount: webCoinWithdrawAmount,
              },
            ],
          },
        },
      });

      if (depositToSavings) {
        await depositWebCoinWhenCheckout(visitId, finalNetAmount, ptx);
      }

      await depositInStoreChipWhenCheckout(visitId, ptx);
    });

    revalidatePath("/daily-visits");
    return { success: true };
  } catch (e) {
    console.error("Settlement failed", e);
    const errorMessage =
      e instanceof Error ? e.message : "決済処理に失敗しました";
    return { success: false, error: errorMessage };
  }
}
