"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type GameParticipationState = {
    errors?: {
        _form?: string[]
        visitId?: string[]
        tournamentId?: string[]
    }
    success?: boolean
    message?: string
}

export async function addTournamentEntry(visitId: string, tournamentId: string): Promise<GameParticipationState> {
    if (!visitId) return { errors: { visitId: ["Visit ID is required"] } }
    if (!tournamentId) return { errors: { tournamentId: ["Tournament ID is required"] } }

    try {
        // Check if entry already exists to avoid unique constraint error
        const existingEntry = await prisma.tournamentEntry.findUnique({
            where: {
                visitId_tournamentId: {
                    visitId,
                    tournamentId
                }
            }
        })

        if (existingEntry) {
            return {
                success: false,
                errors: { _form: ["すでにこのトーナメントに参加しています"] }
            }
        }

        // Create entry
        await prisma.tournamentEntry.create({
            data: {
                visitId,
                tournamentId
            }
        })

        // Also create an initial ENTRY chip event? 
        // Typically participation implies buy-in.
        // For now, let's just create the link. The Chip Event creation might be a separate "Buy-in" step
        // or we automatically add one.
        // Given the requirement "Participate", just linking is the minimum viable.
        // If we want to be fancy we could transactionally create the chip event too, 
        // but let's stick to the request.

        revalidatePath("/daily-visits")
        revalidatePath("/tournaments")
        return { success: true, message: "トーナメントに参加しました" }

    } catch (error) {
        console.error("Failed to add tournament entry:", error)
        return {
            errors: {
                _form: ["トーナメント参加の登録に失敗しました"]
            }
        }
    }
}

export async function addRingGameEntry(visitId: string): Promise<GameParticipationState> {
    if (!visitId) return { errors: { visitId: ["Visit ID is required"] } }

    try {
        const existingEntry = await prisma.ringGameEntry.findUnique({
            where: {
                visitId
            }
        })

        if (existingEntry) {
            return {
                success: false,
                errors: { _form: ["すでにリングゲームに参加しています"] }
            }
        }

        await prisma.ringGameEntry.create({
            data: {
                visitId
            }
        })

        revalidatePath("/daily-visits")
        return { success: true, message: "リングゲームに参加しました" }

    } catch (error) {
        console.error("Failed to add ring game entry:", error)
        return {
            errors: {
                _form: ["リングゲーム参加の登録に失敗しました"]
            }
        }
    }
}
