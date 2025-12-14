"use server"

import { prisma } from "@/lib/prisma"
import { format } from "date-fns"

export type TournamentEntryInfo = {
    id: number
    tournamentName: string
    tournamentId: number
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
    id: number
    visitDate: string
    checkInTime: string
    player: {
        id: number
        memberId: string
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

    const visits = await prisma.visit.findMany({
        where: {
            visitDate: {
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

    return visits.map(visit => {
        // Map tournaments
        const tournaments: TournamentEntryInfo[] = visit.tournamentEntries.map(entry => {
            const entryEvents = entry.chipEvents.filter(e => e.eventType === "ENTRY" || e.eventType === "REENTRY")
            const entryCount = entryEvents.length > 0 ? entryEvents.length : 1 // Default to 1 if no events recorded but entry exists?
            // Actually usually there should be at least 1 ENTRY event.

            // Determine status
            let status: "playing" | "eliminated" | "finished" = "playing"
            if (entry.finalRank) {
                status = "eliminated" // or finished. Let's use eliminated as generic for now.
            }

            return {
                id: entry.id,
                tournamentName: entry.tournament.name,
                tournamentId: entry.tournament.id,
                status,
                rank: entry.finalRank ?? undefined,
                entryCount: entryEvents.length
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
            id: visit.id,
            visitDate: visit.visitDate.toISOString().split('T')[0],
            checkInTime: format(visit.createdAt, "HH:mm"),
            player: {
                id: visit.player.id,
                memberId: visit.player.memberId,
                name: visit.player.name,
                // image: visit.player.image // Add if available in schema later
            },
            tournaments,
            ringGame
        }
    })
}
