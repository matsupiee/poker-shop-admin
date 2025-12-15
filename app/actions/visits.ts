"use server"

import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { revalidatePath } from "next/cache"

export type TournamentEntryInfo = {
    id: string
    tournamentName: string
    tournamentId: string
    status: "playing" | "eliminated" | "finished"
    rank?: number
    timestamp: string
    entryCount: number
}

export type RingGameInfo = {
    joined: boolean
    currentStatus: "playing" | "left"
    totalBuyIn: number
    totalCashOut: number
}

export type DailyVisit = {
    id: string
    visitDate: string
    checkInTime: string
    player: {
        id: string
        memberId: number
        name: string
        image?: string
    }
    tournaments: TournamentEntryInfo[]
    ringGame: RingGameInfo
    settlement?: {
        id: string
        netAmount: number
        createdAt: Date
    }
}

export async function getDailyVisits(date: Date): Promise<DailyVisit[]> {
    // Set time range for the selected date
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    console.log({ startOfDay, endOfDay })

    const visits = await prisma.visit.findMany({
        where: {
            createdAt: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        include: {
            player: true,
            tournamentEntries: {
                include: {
                    tournament: true,
                    chipEvents: true
                },
                orderBy: {
                    createdAt: 'asc'
                }
            },
            ringGameEntry: {
                include: {
                    chipEvents: true
                }
            },
            settlements: true
        },
        orderBy: {
            createdAt: 'asc'
        }
    })

    console.log({ visits })

    return visits.map(visit => {
        // Map tournaments
        const tournaments: TournamentEntryInfo[] = visit.tournamentEntries.map(entry => {
            // Determine status
            let status: "playing" | "eliminated" | "finished" = "playing"
            if (entry.finalRank) {
                status = "eliminated" // or finished. Let's use eliminated as generic for now.
            }

            return {
                id: entry.id.toString(),
                tournamentName: entry.tournament.name,
                tournamentId: entry.tournament.id.toString(),
                status,
                rank: entry.finalRank ?? undefined,
                entryCount: 1,
                timestamp: format(entry.createdAt, "HH:mm")
            }
        })


        // Map ring game
        let ringGame: RingGameInfo = {
            joined: false,
            currentStatus: "left", // Default
            totalBuyIn: 0,
            totalCashOut: 0
        }

        if (visit.ringGameEntry) {
            const buyIn = visit.ringGameEntry.chipEvents
                .filter(e => e.eventType === "BUY_IN")
                .reduce((sum, e) => sum + e.chipAmount, 0)

            const cashOut = visit.ringGameEntry.chipEvents
                .filter(e => e.eventType === "CASH_OUT")
                .reduce((sum, e) => sum + e.chipAmount, 0)

            // Simple logic for status: if cashOut > 0 assume left, otherwise playing
            // This is imperfect but a starting point
            const status = cashOut > 0 ? "left" : "playing"

            ringGame = {
                joined: true,
                currentStatus: status,
                totalBuyIn: buyIn,
                totalCashOut: cashOut
            }
        }

        const settlementInfo = visit.settlements[0] ? {
            id: visit.settlements[0].id,
            netAmount: visit.settlements[0].netAmount,
            createdAt: visit.settlements[0].createdAt
        } : undefined

        return {
            id: visit.id.toString(),
            visitDate: visit.createdAt.toISOString().split('T')[0],
            checkInTime: format(visit.createdAt, "HH:mm"),
            player: {
                id: visit.player.id.toString(),
                memberId: visit.player.memberId,
                name: visit.player.name,
                // image: visit.player.image // Add if available in schema later
            },
            tournaments,
            ringGame,
            settlement: settlementInfo
        }
    })
}

export type RegisterVisitState = {
    errors?: {
        playerId?: string[]
        visitDate?: string[]
        entranceFee?: string[]
        _form?: string[]
    }
    success?: boolean
}

export async function registerVisit(prevState: RegisterVisitState, formData: FormData): Promise<RegisterVisitState> {
    const playerId = formData.get("playerId") as string
    const visitDateStr = formData.get("visitDate") as string // Expecting YYYY-MM-DD
    const entranceFeeStr = formData.get("entranceFee") as string

    const errors: RegisterVisitState["errors"] = {}

    if (!playerId) {
        errors.playerId = ["プレイヤーが選択されていません"]
    }

    let visitDate = new Date()
    if (visitDateStr) {
        visitDate = new Date(visitDateStr)
        if (isNaN(visitDate.getTime())) {
            errors.visitDate = ["日付の形式が正しくありません"]
        }
    }

    let entranceFee: number | null = null
    if (entranceFeeStr && entranceFeeStr.trim() !== "") {
        const fee = parseInt(entranceFeeStr)
        if (isNaN(fee) || fee < 0) {
            errors.entranceFee = ["入場料は0以上の数値を入力してください"]
        } else {
            entranceFee = fee
        }
    }

    if (Object.keys(errors).length > 0) {
        return { errors }
    }

    try {
        // Check for existing visit on the same day
        const startOfDay = new Date(visitDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(visitDate)
        endOfDay.setHours(23, 59, 59, 999)

        const existing = await prisma.visit.findFirst({
            where: {
                playerId: playerId,
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        })

        if (existing) {
            return {
                errors: {
                    _form: ["このプレイヤーは指定された日に既に来店済みです"]
                }
            }
        }

        await prisma.visit.create({
            data: {
                playerId: playerId,
                createdAt: visitDate, // Use visitDate input as createdAt
                entranceFee: entranceFee,
            }
        })

        revalidatePath("/players")
        revalidatePath("/daily-visits")

        return { success: true }
    } catch (e: any) {
        console.error(e)
        return {
            errors: {
                _form: ["来店登録に失敗しました。時間をおいて再度お試しください。"]
            }
        }
    }
}

export async function updateTournamentRank(entryId: string, rank: number) {
    try {
        await prisma.tournamentEntry.update({
            where: { id: entryId },
            data: { finalRank: rank }
        })
        revalidatePath("/daily-visits")
        return { success: true }
    } catch (error) {
        console.error("Failed to update rank", error)
        return { success: false, error: "Failed to update rank" }
    }
}

export async function getVisitSettlementDetails(visitId: string) {
    const visit = await prisma.visit.findUnique({
        where: { id: visitId },
        include: {
            tournamentEntries: {
                include: {
                    tournament: {
                        include: {
                            tournamentPrizes: true
                        }
                    },
                    chipEvents: true
                }
            },
            ringGameEntry: {
                include: {
                    chipEvents: true
                }
            },
            storeCoinDeposit: true
        }
    })

    if (!visit) {
        throw new Error("来店データが見つかりません")
    }

    // 1. Entrance & Food
    const items = []
    // ... (rest of logic same)

    if (visit.entranceFee) {
        items.push({ type: "entrance", label: "入場料", amount: -visit.entranceFee })
    }
    if (visit.foodFee) {
        items.push({ type: "food", label: "飲食代", amount: -visit.foodFee })
    }

    // 2. Tournaments
    for (const entry of visit.tournamentEntries) {
        // Costs
        // Assuming chargeAmount is the cost.
        const entryCost = entry.chipEvents.reduce((sum, e) => sum + e.chargeAmount, 0)
        if (entryCost > 0) {
            items.push({
                type: "tournament_entry",
                label: `大会: ${entry.tournament.name}`,
                amount: -entryCost
            })
        }

        // Prizes
        if (entry.finalRank) {
            const prize = entry.tournament.tournamentPrizes.find(p => p.rank === entry.finalRank)
            if (prize) {
                items.push({
                    type: "tournament_prize",
                    label: `入賞: ${entry.tournament.name} (${entry.finalRank}位)`,
                    amount: prize.amount
                })
            }
        }
    }

    // 3. Ring Game
    if (visit.ringGameEntry) {
        // Buy In (Cost)
        const buyIns = visit.ringGameEntry.chipEvents.filter(e => e.eventType === "BUY_IN")
        const totalBuyInCost = buyIns.reduce((sum, e) => sum + (e.chargeAmount ?? e.chipAmount), 0)

        if (totalBuyInCost > 0) {
            items.push({
                type: "ring_game_buyin",
                label: "リングゲーム購入",
                amount: -totalBuyInCost
            })
        }

        // Cash Out (Credit)
        const cashOuts = visit.ringGameEntry.chipEvents.filter(e => e.eventType === "CASH_OUT")
        const totalCashOutVal = cashOuts.reduce((sum, e) => sum + e.chipAmount, 0) // Assuming 1 chip = 1 currency unit

        if (totalCashOutVal > 0) {
            items.push({
                type: "ring_game_cashout",
                label: "リングゲーム換金",
                amount: totalCashOutVal
            })
        }
    }

    const netAmount = items.reduce((sum, item) => sum + item.amount, 0)

    return {
        items,
        netAmount,
        isDeposited: !!visit.storeCoinDeposit
    }
}

export async function settleVisit(visitId: string, breakdown: any, netAmount: number, depositToSavings: boolean = false) {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Settlement Logic
            const existingSettlement = await tx.settlement.findFirst({
                where: { visitId }
            })

            if (existingSettlement) {
                await tx.settlement.update({
                    where: { id: existingSettlement.id },
                    data: {
                        netAmount,
                        breakdown
                    }
                })
            } else {
                await tx.settlement.create({
                    data: {
                        visitId,
                        netAmount,
                        breakdown
                    }
                })
            }

            // 2. Deposit Logic
            const visit = await tx.visit.findUnique({
                where: { id: visitId },
                include: { player: true }
            })

            if (!visit) {
                throw new Error("来店データが見つかりません")
            }

            const existingDeposit = await tx.storeCoinDeposit.findUnique({
                where: { visitId } // using unique visitId
            })

            if (depositToSavings && netAmount > 0) {
                if (existingDeposit) {
                    // Update existing deposit
                    const diff = netAmount - existingDeposit.depositAmount
                    await tx.storeCoinDeposit.update({
                        where: { id: existingDeposit.id },
                        data: { depositAmount: netAmount }
                    })
                    await tx.player.update({
                        where: { id: visit.player.id },
                        data: { storeCoinBalance: { increment: diff } }
                    })
                } else {
                    // Create new deposit
                    await tx.storeCoinDeposit.create({
                        data: {
                            playerId: visit.player.id,
                            depositAmount: netAmount,
                            visitId: visitId
                        }
                    })
                    await tx.player.update({
                        where: { id: visit.player.id },
                        data: { storeCoinBalance: { increment: netAmount } }
                    })
                }
            } else {
                // Not depositing or invalid amount for deposit
                if (existingDeposit) {
                    // Remove existing deposit and revert balance
                    await tx.storeCoinDeposit.delete({
                        where: { id: existingDeposit.id }
                    })
                    await tx.player.update({
                        where: { id: visit.player.id },
                        data: { storeCoinBalance: { decrement: existingDeposit.depositAmount } }
                    })
                }
            }
        })

        revalidatePath("/daily-visits")
        return { success: true }
    } catch (e) {
        console.error("Settlement failed", e)
        return { success: false, error: "決済処理に失敗しました" }
    }
}

