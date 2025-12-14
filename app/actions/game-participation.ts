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

export async function addTournamentEntry(visitId: string, tournamentId: string, chipAmount: number): Promise<GameParticipationState> {
    if (!visitId) return { errors: { visitId: ["Visit ID is required"] } }
    if (!tournamentId) return { errors: { tournamentId: ["Tournament ID is required"] } }
    if (chipAmount < 0) return { errors: { _form: ["チップ量は0以上である必要があります"] } }

    try {
        // Check if entry already exists
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

        // Create entry with initial chip event
        await prisma.tournamentEntry.create({
            data: {
                visitId,
                tournamentId,
                chipEvents: {
                    create: {
                        eventType: "ENTRY",
                        chipAmount: chipAmount
                    }
                }
            }
        })

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

export async function addRingGameEntry(visitId: string, chipAmount: number): Promise<GameParticipationState> {
    if (!visitId) return { errors: { visitId: ["Visit ID is required"] } }
    if (chipAmount < 0) return { errors: { _form: ["チップ量は0以上である必要があります"] } }

    try {
        const existingEntry = await prisma.ringGameEntry.findUnique({
            where: {
                visitId
            }
        })

        if (existingEntry) {
            // Check if there are any chip events, if so, maybe we are just buying in again?
            // But the current logic assumes one RingGameEntry per visit.
            // If the user wants to "Re-join" or "Add-on" that would be a different flow likely.
            // However, for Ring Games, typically you stay in the "Entry" but just add chips.
            // But here we are "Participating" (Creating the Entry).

            return {
                success: false,
                errors: { _form: ["すでにリングゲームに参加しています"] }
            }
        }

        await prisma.ringGameEntry.create({
            data: {
                visitId,
                chipEvents: {
                    create: {
                        eventType: "BUY_IN",
                        chipAmount: chipAmount
                    }
                }
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

export async function addRingGameChip(
    visitId: string,
    type: "BUY_IN" | "CASH_OUT",
    amount: number
): Promise<GameParticipationState> {
    if (!visitId) return { errors: { visitId: ["Visit ID is required"] } }
    if (amount <= 0) return { errors: { _form: ["チップ量は0より大きい必要があります"] } }

    try {
        const entry = await prisma.ringGameEntry.findUnique({
            where: { visitId }
        })

        if (!entry) {
            return {
                success: false,
                errors: { _form: ["リングゲームに参加していません"] }
            }
        }

        await prisma.ringGameChipEvent.create({
            data: {
                ringGameEntryId: entry.id,
                eventType: type,
                chipAmount: amount
            }
        })

        revalidatePath("/daily-visits")
        return {
            success: true,
            message: type === "BUY_IN" ? "チップを追加しました" : "キャッシュアウトしました"
        }

    } catch (error) {
        console.error("Failed to add ring game chip event:", error)
        return {
            errors: {
                _form: ["処理に失敗しました"]
            }
        }
    }
}
