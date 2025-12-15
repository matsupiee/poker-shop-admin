"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export type CreateTournamentState = {
    errors?: {
        name?: string[]
        eventDate?: string[]
        startTime?: string[]
        entryClosesTime?: string[]
        _form?: string[]
    }
    success?: boolean
}

export async function createTournament(prevState: CreateTournamentState, formData: FormData): Promise<CreateTournamentState> {
    const name = formData.get("name") as string
    const eventDateStr = formData.get("eventDate") as string // Expecting YYYY-MM-DD
    const startTimeStr = formData.get("startTime") as string // Expecting HH:MM
    const entryClosesTimeStr = formData.get("entryClosesTime") as string // Expecting HH:MM
    const prizesStr = formData.get("prizes") as string

    const errors: CreateTournamentState["errors"] = {}

    if (!name || name.trim().length === 0) {
        errors.name = ["トーナメント名を入力してください"]
    }

    if (!eventDateStr) {
        errors.eventDate = ["開催日を入力してください"]
    }

    if (!startTimeStr) {
        errors.startTime = ["開始時刻を入力してください"]
    }

    if (!entryClosesTimeStr) {
        errors.entryClosesTime = ["締切時刻を入力してください"]
    }

    if (Object.keys(errors).length > 0) {
        return { errors }
    }

    let prizes: { rank: number; amount: number }[] = []
    if (prizesStr) {
        try {
            const parsed = JSON.parse(prizesStr)
            if (Array.isArray(parsed)) {
                prizes = parsed
                    .map((p: any) => ({
                        rank: Number(p.rank),
                        amount: Number(p.amount)
                    }))
                    .filter(p => !isNaN(p.rank) && !isNaN(p.amount) && p.amount > 0)
            }
        } catch (e) {
            console.error("Failed to parse prizes", e)
        }
    }

    try {
        const startAt = new Date(`${eventDateStr}T${startTimeStr}`)
        // Handle case where entry closes after midnight
        // If close time is smaller than start time, assume it's next day?
        // OR simpler: just combine with eventDateStr. If user means next day, they might need better UI or we assume same day for now.
        // Let's assume same day for simplicity unless it's clearly earlier than start time?
        // Actually, let's just combine with eventDateStr. If it's overnight tournament, `eventDate` is just the "logical" date.
        // But `entryClosesAt` needs to be accurate.
        // Let's keep it simple: just combine date and time. If it requires date change, users might need to input full date or we add +1 day logic if close < start.

        // Simple logic: if entryClosesTime < startTime, add 1 day to entryClosesAt
        let entryClosesAt = new Date(`${eventDateStr}T${entryClosesTimeStr}`)

        if (entryClosesAt < startAt) {
            const nextDay = new Date(entryClosesAt)
            nextDay.setDate(nextDay.getDate() + 1)
            entryClosesAt = nextDay
        }

        await prisma.tournament.create({
            data: {
                name,
                startAt,
                entryClosesAt,
                tournamentPrizes: {
                    create: prizes.map(p => ({
                        rank: Number(p.rank),
                        amount: Number(p.amount)
                    }))
                }
            }
        })

        revalidatePath("/tournaments")
        return { success: true }
    } catch (e: any) {
        console.error(e)
        return {
            errors: {
                _form: ["トーナメントの作成に失敗しました。"]
            }
        }
    }
}


export async function getTournaments(date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    try {
        const tournaments = await prisma.tournament.findMany({
            where: {
                startAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                _count: {
                    select: { entries: true }
                },
                tournamentPrizes: {
                    orderBy: {
                        rank: 'asc'
                    }
                }
            },
            orderBy: {
                startAt: 'asc'
            }
        })
        return tournaments
    } catch (error) {
        console.error("Failed to fetch tournaments:", error)
        return []
    }
}
