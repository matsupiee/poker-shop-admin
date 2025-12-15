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
                }
            },
            ringGameEntry: {
                include: {
                    chipEvents: true
                }
            }
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
                entryCount: 1
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
            ringGame
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
