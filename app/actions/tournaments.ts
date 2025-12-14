"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export type CreateTournamentState = {
    errors?: {
        name?: string[]
        eventDate?: string[]
        _form?: string[]
    }
    success?: boolean
}

export async function createTournament(prevState: CreateTournamentState, formData: FormData): Promise<CreateTournamentState> {
    const name = formData.get("name") as string
    const eventDateStr = formData.get("eventDate") as string // Expecting YYYY-MM-DD
    const prizesStr = formData.get("prizes") as string

    const errors: CreateTournamentState["errors"] = {}

    if (!name || name.trim().length === 0) {
        errors.name = ["トーナメント名を入力してください"]
    }

    if (!eventDateStr) {
        errors.eventDate = ["開催日を入力してください"]
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
                    .filter(p => !isNaN(p.rank) && !isNaN(p.amount) && p.amount >= 0)
            }
        } catch (e) {
            console.error("Failed to parse prizes", e)
        }
    }

    try {
        const eventDate = new Date(eventDateStr)

        await prisma.tournament.create({
            data: {
                name,
                eventDate,
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
                eventDate: {
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
                eventDate: 'asc'
            }
        })
        return tournaments
    } catch (error) {
        console.error("Failed to fetch tournaments:", error)
        return []
    }
}
