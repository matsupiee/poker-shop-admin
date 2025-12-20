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
    const hasBounty = formData.get("hasBounty") === "on"
    const bountyTicketCountStr = formData.get("bountyTicketCount") as string
    const bountyTotalAmountStr = formData.get("bountyTotalAmount") as string

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

    if (eventDateStr && startTimeStr) {
        const startAt = new Date(`${eventDateStr}T${startTimeStr}`)
        if (startAt < new Date()) {
            errors.startTime = ["開始時刻は未来の時間を指定してください"]
        }
    }

    let bountyTicketCount = 0
    let bountyTotalAmount = 0

    if (hasBounty) {
        if (!bountyTicketCountStr || isNaN(Number(bountyTicketCountStr)) || Number(bountyTicketCountStr) < 1) {
            errors._form = [...(errors._form || []), "バウンティチケット枚数を正しく入力してください"]
        } else {
            bountyTicketCount = Number(bountyTicketCountStr)
        }

        if (!bountyTotalAmountStr || isNaN(Number(bountyTotalAmountStr)) || Number(bountyTotalAmountStr) < 0) {
            errors._form = [...(errors._form || []), "バウンティ総額を正しく入力してください"]
        } else {
            bountyTotalAmount = Number(bountyTotalAmountStr)
        }
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
                    .sort((a, b) => a.rank - b.rank)

                for (let i = 1; i < prizes.length; i++) {
                    if (prizes[i].amount > prizes[i - 1].amount) {
                        return {
                            errors: {
                                _form: [`${prizes[i].rank}位の賞金が${prizes[i - 1].rank}位より大きくなっています。`]
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Failed to parse prizes", e)
        }
    }

    try {
        const startAt = new Date(`${eventDateStr}T${startTimeStr}`)
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
                },
                tournamentBounty: hasBounty ? {
                    create: {
                        ticketCount: bountyTicketCount,
                        totalAmount: bountyTotalAmount
                    }
                } : undefined
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


export async function getTournaments(date?: Date) {
    let whereClause: any = {}

    if (date) {
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        whereClause = {
            startAt: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    }

    try {
        const tournaments = await prisma.tournament.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: { entries: true }
                },
                tournamentPrizes: {
                    orderBy: {
                        rank: 'asc'
                    }
                },
                tournamentBounty: true
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

export async function updateTournament(id: string, prevState: CreateTournamentState, formData: FormData): Promise<CreateTournamentState> {
    const name = formData.get("name") as string
    const eventDateStr = formData.get("eventDate") as string // Expecting YYYY-MM-DD
    const startTimeStr = formData.get("startTime") as string // Expecting HH:MM
    const entryClosesTimeStr = formData.get("entryClosesTime") as string // Expecting HH:MM
    const prizesStr = formData.get("prizes") as string
    const hasBounty = formData.get("hasBounty") === "on"
    const bountyTicketCountStr = formData.get("bountyTicketCount") as string
    const bountyTotalAmountStr = formData.get("bountyTotalAmount") as string

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

    let bountyTicketCount = 0
    let bountyTotalAmount = 0

    if (hasBounty) {
        if (!bountyTicketCountStr || isNaN(Number(bountyTicketCountStr)) || Number(bountyTicketCountStr) < 1) {
            errors._form = [...(errors._form || []), "バウンティチケット枚数を正しく入力してください"]
        } else {
            bountyTicketCount = Number(bountyTicketCountStr)
        }

        if (!bountyTotalAmountStr || isNaN(Number(bountyTotalAmountStr)) || Number(bountyTotalAmountStr) < 0) {
            errors._form = [...(errors._form || []), "バウンティ総額を正しく入力してください"]
        } else {
            bountyTotalAmount = Number(bountyTotalAmountStr)
        }
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
                    .sort((a, b) => a.rank - b.rank)

                for (let i = 1; i < prizes.length; i++) {
                    if (prizes[i].amount > prizes[i - 1].amount) {
                        return {
                            errors: {
                                _form: [`${prizes[i].rank}位の賞金が${prizes[i - 1].rank}位より大きくなっています。`]
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Failed to parse prizes", e)
        }
    }

    try {
        const tournament = await prisma.tournament.findUnique({
            where: { id }
        })

        if (!tournament) {
            return {
                errors: {
                    _form: ["トーナメントが見つかりません。"]
                }
            }
        }

        if (tournament.startAt < new Date()) {
            return {
                errors: {
                    _form: ["開始時刻を過ぎているため、編集できません。"]
                }
            }
        }

        const startAt = new Date(`${eventDateStr}T${startTimeStr}`)
        let entryClosesAt = new Date(`${eventDateStr}T${entryClosesTimeStr}`)

        if (entryClosesAt < startAt) {
            const nextDay = new Date(entryClosesAt)
            nextDay.setDate(nextDay.getDate() + 1)
            entryClosesAt = nextDay
        }

        await prisma.$transaction(async (tx) => {
            // Update tournament details
            await tx.tournament.update({
                where: { id },
                data: {
                    name,
                    startAt,
                    entryClosesAt,
                }
            })

            // Replace prizes
            await tx.tournamentPrize.deleteMany({
                where: { tournamentId: id }
            })

            if (prizes.length > 0) {
                await tx.tournamentPrize.createMany({
                    data: prizes.map(p => ({
                        tournamentId: id,
                        rank: p.rank,
                        amount: p.amount
                    }))
                })
            }

            // Handle Bounty
            if (hasBounty) {
                await tx.tournamentBounty.upsert({
                    where: { tournamentId: id },
                    create: {
                        tournamentId: id,
                        ticketCount: bountyTicketCount,
                        totalAmount: bountyTotalAmount
                    },
                    update: {
                        ticketCount: bountyTicketCount,
                        totalAmount: bountyTotalAmount
                    }
                })
            } else {
                await tx.tournamentBounty.deleteMany({
                    where: { tournamentId: id }
                })
            }
        })

        revalidatePath("/tournaments")
        return { success: true }
    } catch (e: any) {
        console.error(e)
        return {
            errors: {
                _form: ["トーナメントの更新に失敗しました。"]
            }
        }
    }
}

