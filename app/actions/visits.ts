"use server"

import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { revalidatePath } from "next/cache"

export type TournamentEventInfo = {
    eventId: string
    entryId: string
    tournamentName: string
    tournamentId: string
    eventType: "ENTRY" | "ADD_CHIP"
    chipAmount: number
    chargeAmount: number
    status: "playing" | "eliminated" | "finished"
    rank?: number
    bountyCount?: number
    hasBounty: boolean
    timestamp: string
    isLatestEntry: boolean
}

export type RingGameChipEventInfo = {
    eventType: string
    chipAmount: number
    timestamp: string
}

export type RingGameInfo = {
    id: string
    joined: boolean
    currentStatus: "playing" | "left"
    totalBuyIn: number
    totalCashOut: number
    timeline: RingGameChipEventInfo[]
    ringGameType?: "WEB_COIN" | "IN_STORE"
}

export type DailyVisit = {
    id: string
    visitDate: string
    checkInTime: string
    player: {
        id: string
        memberId: string
        name: string
        image?: string
        webCoinBalance: number
        inStoreChipBalance: number
    }
    tournaments: TournamentEventInfo[]
    ringGameEntries: RingGameInfo[]
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
                    tournament: {
                        include: {
                            tournamentBounty: true
                        }
                    },
                    chipEvents: true
                },
                orderBy: {
                    createdAt: 'asc'
                }
            },
            webCoinRingEntry: {
                include: {
                    webCoinRingChipEvents: {
                        orderBy: {
                            createdAt: 'asc'
                        }
                    }
                }
            },
            inStoreRingEntry: {
                include: {
                    inStoreRingChipEvents: {
                        orderBy: {
                            createdAt: 'asc'
                        }
                    }
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
        // Group entries by tournament to find the latest one for each tournament
        const entriesByTournament = visit.tournamentEntries.reduce((acc, entry) => {
            if (!acc[entry.tournamentId]) {
                acc[entry.tournamentId] = []
            }
            acc[entry.tournamentId].push(entry)
            return acc
        }, {} as Record<string, typeof visit.tournamentEntries>)

        // Map tournaments to a flat list of chip events
        const tournaments: TournamentEventInfo[] = visit.tournamentEntries.flatMap(entry => {
            // Determine status
            let status: "playing" | "eliminated" | "finished" = "playing"
            if (entry.finalRank) {
                status = "eliminated"
            }

            // Check if this is the latest entry for this tournament in this visit
            const entries = entriesByTournament[entry.tournamentId]
            const latestEntry = entries[entries.length - 1]
            const isLatestEntry = entry.id === latestEntry.id

            return entry.chipEvents.map(event => ({
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
                isLatestEntry
            }))
        })


        // Map ring games
        const ringGames: RingGameInfo[] = []

        if (visit.webCoinRingEntry) {
            const entry = visit.webCoinRingEntry
            const buyIn = entry.webCoinRingChipEvents
                .filter(e => e.eventType === "BUY_IN")
                .reduce((sum, e) => sum + e.chipAmount, 0)

            const cashOut = entry.webCoinRingChipEvents
                .filter(e => e.eventType === "CASH_OUT")
                .reduce((sum, e) => sum + e.chipAmount, 0)

            const status = cashOut > 0 ? "left" : "playing"

            const timeline: RingGameChipEventInfo[] = entry.webCoinRingChipEvents.map(e => ({
                eventType: e.eventType,
                chipAmount: e.chipAmount,
                timestamp: format(e.createdAt, "HH:mm")
            }))

            ringGames.push({
                id: entry.id,
                joined: true,
                currentStatus: status,
                totalBuyIn: buyIn,
                totalCashOut: cashOut,
                timeline,
                ringGameType: "WEB_COIN"
            })
        }

        if (visit.inStoreRingEntry) {
            const entry = visit.inStoreRingEntry
            const buyIn = entry.inStoreRingChipEvents
                .filter(e => e.eventType === "BUY_IN")
                .reduce((sum, e) => sum + e.chipAmount, 0)

            const cashOut = entry.inStoreRingChipEvents
                .filter(e => e.eventType === "CASH_OUT")
                .reduce((sum, e) => sum + e.chipAmount, 0)

            const status = cashOut > 0 ? "left" : "playing"

            const timeline: RingGameChipEventInfo[] = entry.inStoreRingChipEvents.map(e => ({
                eventType: e.eventType,
                chipAmount: e.chipAmount,
                timestamp: format(e.createdAt, "HH:mm")
            }))

            ringGames.push({
                id: entry.id,
                joined: true,
                currentStatus: status,
                totalBuyIn: buyIn,
                totalCashOut: cashOut,
                timeline,
                ringGameType: "IN_STORE"
            })
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
                webCoinBalance: visit.player.webCoinBalance,
                inStoreChipBalance: visit.player.inStoreChipBalance,
                // image: visit.player.image // Add if available in schema later
            },
            tournaments,
            ringGameEntries: ringGames,
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

export async function registerVisit(_: RegisterVisitState, formData: FormData): Promise<RegisterVisitState> {
    const playerId = formData.get("playerId") as string
    const entranceFeeStr = formData.get("entranceFee") as string

    const errors: RegisterVisitState["errors"] = {}

    if (!playerId) {
        errors.playerId = ["プレイヤーが選択されていません"]
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
        const existing = await prisma.visit.findFirst({
            where: {
                playerId: playerId,
            },
            include: {
                settlements: true
            },
            orderBy: [{
                createdAt: "desc"
            }]
        })

        console.log({ existing })

        // Only block if there's an existing visit without settlement
        if (existing && existing.settlements.length === 0) {
            return {
                errors: {
                    _form: ["このプレイヤーの前回の来店の決済が完了していません。決済を完了させてください"]
                }
            }
        }

        await prisma.visit.create({
            data: {
                playerId: playerId,
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

export async function updateTournamentResult(entryId: string, rank?: number, bountyCount?: number) {
    try {
        const entry = await prisma.tournamentEntry.findUnique({
            where: { id: entryId },
            include: {
                visit: true
            }
        })

        if (!entry) {
            return { success: false, error: "Entry not found" }
        }

        // Check if this is the latest entry for the player in this tournament
        const latestEntry = await prisma.tournamentEntry.findFirst({
            where: {
                tournamentId: entry.tournamentId,
                visit: {
                    playerId: entry.visit.playerId
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        if (latestEntry && latestEntry.id !== entry.id) {
            return { success: false, error: "最新のエントリー以外には結果を記録できません" }
        }

        await prisma.tournamentEntry.update({
            where: { id: entryId },
            data: {
                finalRank: rank,
                bountyCount: bountyCount
            }
        })
        revalidatePath("/daily-visits")
        return { success: true }
    } catch (error) {
        console.error("Failed to update tournament result", error)
        return { success: false, error: "結果の更新に失敗しました" }
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
            webCoinRingEntry: {
                include: {
                    webCoinRingChipEvents: true
                }
            },
            inStoreRingEntry: {
                include: {
                    inStoreRingChipEvents: true
                }
            },
            inStoreChipDeposit: true
        }
    })

    if (!visit) {
        throw new Error("来店データが見つかりません")
    }

    // 1. Entrance & Food
    const items = []

    if (visit.entranceFee) {
        items.push({
            type: "entrance",
            label: "入場料",
            amount: -visit.entranceFee,
            groupId: "entrance",
            groupName: "入場料"
        })
    }
    if (visit.foodFee) {
        items.push({
            type: "food",
            label: "飲食代",
            amount: -visit.foodFee,
            groupId: "entrance",
            groupName: "入場料"
        })
    }

    // 2. Tournaments
    for (const entry of visit.tournamentEntries) {
        const groupId = `tournament_${entry.tournamentId}`
        const groupName = entry.tournament.name

        // Detailed Cost Breakdown
        for (const event of entry.chipEvents) {
            if (event.chargeAmount > 0) {
                let label = "エントリー"
                if (event.eventType === "ADD_CHIP") label = "アドオン/リエントリー"

                items.push({
                    type: "tournament_entry",
                    label: label,
                    amount: -event.chargeAmount,
                    groupId,
                    groupName
                })
            }
        }

        // Prizes
        if (entry.finalRank) {
            const prize = entry.tournament.tournamentPrizes.find(p => p.rank === entry.finalRank)
            if (prize) {
                items.push({
                    type: "tournament_prize",
                    label: `入賞 (${entry.finalRank}位)`,
                    amount: prize.amount,
                    groupId,
                    groupName
                })
            }
        }
    }

    // 3. Ring Games
    const processRingEntry = (entry: any, type: "WEB_COIN" | "IN_STORE") => {
        const groupId = `ring_${type}`
        const groupName = type === "WEB_COIN" ? "webコインリング" : "店内リング"
        const events = type === "WEB_COIN" ? entry.webCoinRingChipEvents : entry.inStoreRingChipEvents

        // Buy In (Cost)
        const buyIns = events.filter((e: any) => e.eventType === "BUY_IN")
        for (const event of buyIns) {
            if (event.chipAmount > 0) {
                items.push({
                    type: "ring_game_buyin",
                    label: "購入",
                    amount: -event.chipAmount,
                    groupId,
                    groupName
                })
            }
        }

        // Cash Out (Credit)
        const cashOuts = events.filter((e: any) => e.eventType === "CASH_OUT")
        for (const event of cashOuts) {
            if (event.chipAmount > 0) {
                items.push({
                    type: "ring_game_cashout",
                    label: "換金",
                    amount: event.chipAmount,
                    groupId,
                    groupName
                })
            }
        }
    }

    if (visit.webCoinRingEntry) {
        processRingEntry(visit.webCoinRingEntry, "WEB_COIN")
    }

    if (visit.inStoreRingEntry) {
        processRingEntry(visit.inStoreRingEntry, "IN_STORE")
    }

    const netAmount = items.reduce((sum, item) => sum + item.amount, 0)

    return {
        items,
        netAmount,
        isDeposited: !!visit.inStoreChipDeposit
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
                        taxAmount: 0, // Default to 0, calculation can be added later
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

            const existingDeposit = await tx.inStoreChipDeposit.findUnique({
                where: { visitId } // using unique visitId
            })

            if (depositToSavings && netAmount > 0) {
                if (existingDeposit) {
                    // Update existing deposit
                    const diff = netAmount - existingDeposit.depositAmount
                    await tx.inStoreChipDeposit.update({
                        where: { id: existingDeposit.id },
                        data: { depositAmount: netAmount }
                    })
                    await tx.player.update({
                        where: { id: visit.player.id },
                        data: { inStoreChipBalance: { increment: diff } }
                    })
                } else {
                    // Create new deposit
                    await tx.inStoreChipDeposit.create({
                        data: {
                            playerId: visit.player.id,
                            depositAmount: netAmount,
                            visitId: visitId
                        }
                    })
                    await tx.player.update({
                        where: { id: visit.player.id },
                        data: { inStoreChipBalance: { increment: netAmount } }
                    })
                }
            } else {
                // Not depositing or invalid amount for deposit
                if (existingDeposit) {
                    // Remove existing deposit and revert balance
                    await tx.inStoreChipDeposit.delete({
                        where: { id: existingDeposit.id }
                    })
                    await tx.player.update({
                        where: { id: visit.player.id },
                        data: { inStoreChipBalance: { decrement: existingDeposit.depositAmount } }
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

