"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { withdrawInStoreChip } from "./in-store-chip"
import { InStoreRingChipEventType, WebCoinRingChipEventType } from "@/lib/generated/prisma/client"

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

export async function addRingGameEntry(
    visitId: string,
    chipAmount: number,
    ringGameType: "WEB_COIN" | "IN_STORE",
    eventType: string = "BUY_IN"
): Promise<GameParticipationState> {
    if (!visitId) return { errors: { visitId: ["Visit ID is required"] } }
    if (chipAmount < 0) return { errors: { _form: ["チップ量は0以上である必要があります"] } }

    try {
        if (ringGameType === "WEB_COIN") {
            const existingEntry = await prisma.webCoinRingEntry.findUnique({
                where: { visitId }
            })
            if (existingEntry) {
                return { success: false, errors: { _form: ["すでにこの種類のリングゲームに参加しています"] } }
            }
            await prisma.webCoinRingEntry.create({
                data: {
                    visitId,
                    webCoinRingChipEvents: {
                        create: {
                            eventType: eventType as WebCoinRingChipEventType,
                            chipAmount,
                        }
                    }
                }
            })
        } else {
            const existingEntry = await prisma.inStoreRingEntry.findUnique({
                where: { visitId }
            })
            if (existingEntry) {
                return { success: false, errors: { _form: ["すでにこの種類のリングゲームに参加しています"] } }
            }

            // 店内リングエントリを作成し、訪問情報とプレイヤー情報を取得
            const visit = await prisma.visit.findUnique({
                where: { id: visitId },
                include: { player: true }
            })

            if (!visit) {
                return { success: false, errors: { _form: ["訪問データが見つかりません"] } }
            }

            const entry = await prisma.inStoreRingEntry.create({
                data: {
                    visitId,
                    inStoreRingChipEvents: {
                        create: {
                            eventType: eventType as InStoreRingChipEventType,
                            chipAmount,
                        }
                    }
                },
                include: {
                    inStoreRingChipEvents: true
                }
            })

            // WITHDRAWの場合は、プレイヤーの貯チップから引き出す
            if (eventType === "WITHDRAW") {
                const chipEvent = entry.inStoreRingChipEvents[0]
                try {
                    await withdrawInStoreChip(visit.playerId, chipAmount, chipEvent.id)
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "引き出しに失敗しました"
                    return {
                        success: false,
                        errors: {
                            _form: [errorMessage]
                        }
                    }
                }
            }
        }

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
    ringGameEntryId: string,
    type: string,
    amount: number,
    ringGameType: "WEB_COIN" | "IN_STORE"
): Promise<GameParticipationState> {
    if (!ringGameEntryId) return { errors: { _form: ["Ring Game Entry ID is required"] } }
    if (amount < 0) return { errors: { _form: ["チップ量は0以上である必要があります"] } }

    try {
        if (ringGameType === "WEB_COIN") {
            const entry = await prisma.webCoinRingEntry.findUnique({
                where: { id: ringGameEntryId }
            })
            if (!entry) {
                return { success: false, errors: { _form: ["リングゲームに参加していません"] } }
            }
            await prisma.webCoinRingChipEvent.create({
                data: {
                    webCoinRingEntryId: entry.id,
                    eventType: type as WebCoinRingChipEventType,
                    chipAmount: amount,
                }
            })
        } else {
            const entry = await prisma.inStoreRingEntry.findUnique({
                where: { id: ringGameEntryId },
                include: {
                    visit: {
                        include: {
                            player: true
                        }
                    }
                }
            })
            if (!entry) {
                return { success: false, errors: { _form: ["リングゲームに参加していません"] } }
            }

            // まずInStoreRingChipEventを作成
            const chipEvent = await prisma.inStoreRingChipEvent.create({
                data: {
                    inStoreRingEntryId: entry.id,
                    eventType: type as InStoreRingChipEventType,
                    chipAmount: amount,
                }
            })

            // WITHDRAWの場合は、chipEventIdを渡してwithdrawInStoreChipメソッドを呼び出す
            if (type === "WITHDRAW") {
                try {
                    await withdrawInStoreChip(entry.visit.playerId, amount, chipEvent.id)
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "引き出しに失敗しました"
                    return {
                        success: false,
                        errors: {
                            _form: [errorMessage]
                        }
                    }
                }
            }
        }

        revalidatePath("/daily-visits")
        return {
            success: true,
            message: "データを登録しました"
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
