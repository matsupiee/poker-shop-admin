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

export async function addTournamentEntry(
    visitId: string,
    tournamentId: string,
    chipAmount: number,
    entrySource: "BUY_IN" | "FREE" | "SATELLITE",
    paymentAmount: number
): Promise<GameParticipationState> {
    if (!visitId) return { errors: { visitId: ["Visit ID is required"] } }
    if (!tournamentId) return { errors: { tournamentId: ["Tournament ID is required"] } }
    if (chipAmount < 0) return { errors: { _form: ["チップ量は0以上である必要があります"] } }
    if (paymentAmount < 0) return { errors: { _form: ["支払い額は0以上である必要があります"] } }

    try {
        // Create entry with initial chip event
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId }
        })

        if (!tournament) {
            return { errors: { tournamentId: ["指定されたトーナメントが見つかりません"] } }
        }

        if (new Date() > tournament.entryClosesAt) {
            return { errors: { _form: ["エントリー締め切り時刻を過ぎています"] } }
        }

        await prisma.tournamentEntry.create({
            data: {
                visitId,
                tournamentId,
                entrySource,
                chipEvents: {
                    create: {
                        eventType: "ENTRY",
                        chipAmount: chipAmount,
                        chargeAmount: paymentAmount
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

export async function addTournamentAddOn(
    tournamentEntryId: string,
    chipAmount: number,
    chargeAmount: number
): Promise<GameParticipationState> {
    if (!tournamentEntryId) return { errors: { _form: ["Entry ID is required"] } }
    if (chipAmount < 0) return { errors: { _form: ["チップ量は0以上である必要があります"] } }
    if (chargeAmount < 0) return { errors: { _form: ["支払い額は0以上である必要があります"] } }

    try {
        const entry = await prisma.tournamentEntry.findUnique({
            where: { id: tournamentEntryId },
            include: {
                tournament: true,
                visit: {
                    include: {
                        player: true
                    }
                }
            }
        })

        if (!entry) {
            return { errors: { _form: ["参加データが見つかりません"] } }
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
            return {
                errors: {
                    _form: ["最新のエントリー以外にはアドオンできません"]
                }
            }
        }

        await prisma.tournamentChipEvent.create({
            data: {
                tournamentEntryId,
                eventType: "ADD_CHIP",
                chipAmount,
                chargeAmount
            }
        })

        revalidatePath("/daily-visits")
        revalidatePath("/tournaments")
        revalidatePath(`/tournaments/${entry.tournamentId}`)
        return { success: true, message: "アドオンを追加しました" }

    } catch (error) {
        console.error("Failed to add tournament add-on:", error)
        return {
            errors: {
                _form: ["アドオンの追加に失敗しました"]
            }
        }
    }
}
