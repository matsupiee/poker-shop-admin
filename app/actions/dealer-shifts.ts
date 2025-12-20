"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Staff } from "@/lib/generated/prisma/client"

export type DealerShiftState = {
    errors?: {
        staffId?: string[]
        startedAt?: string[]
        endedAt?: string[]
        tableName?: string[]
        rakeChip?: string[]
        jpRakeChip?: string[]
        dealerChip?: string[]
        _form?: string[]
    }
    success?: boolean
}

export async function createDealerShift(prevState: DealerShiftState, formData: FormData): Promise<DealerShiftState> {
    const staffId = formData.get("staffId") as string
    const dateStr = formData.get("date") as string // YYYY-MM-DD
    const startTimeStr = formData.get("startTime") as string // HH:MM
    const endTimeStr = formData.get("endTime") as string // HH:MM
    const tableName = formData.get("tableName") as string
    const rakeChipStr = formData.get("rakeChip") as string
    const jpRakeChipStr = formData.get("jpRakeChip") as string
    const dealerChipStr = formData.get("dealerChip") as string

    const errors: DealerShiftState["errors"] = {}

    if (!staffId) {
        errors.staffId = ["スタッフを選択してください"]
    }

    if (!dateStr) {
        errors.startedAt = ["日付を入力してください"]
    }

    if (!startTimeStr) {
        errors.startedAt = ["開始時間を入力してください"]
    }

    if (!tableName) {
        errors.tableName = ["テーブル名を入力してください"]
    }

    const rakeChip = rakeChipStr ? parseInt(rakeChipStr) : 0
    const jpRakeChip = jpRakeChipStr ? parseInt(jpRakeChipStr) : 0
    const dealerChip = dealerChipStr ? parseInt(dealerChipStr) : 0

    if (isNaN(rakeChip) || rakeChip < 0) {
        errors.rakeChip = ["レーキチップを正しく入力してください"]
    }
    if (isNaN(jpRakeChip) || jpRakeChip < 0) {
        errors.jpRakeChip = ["JPレーキチップを正しく入力してください"]
    }
    if (isNaN(dealerChip) || dealerChip < 0) {
        errors.dealerChip = ["ディーラーチップを正しく入力してください"]
    }

    if (Object.keys(errors).length > 0) {
        return { errors }
    }

    try {
        const startedAt = new Date(`${dateStr}T${startTimeStr}`)
        let endedAt: Date | null = null

        if (endTimeStr) {
            endedAt = new Date(`${dateStr}T${endTimeStr}`)
            // If end time is before start time, assume it's the next day
            if (endedAt < startedAt) {
                endedAt.setDate(endedAt.getDate() + 1)
            }
        }

        await prisma.ringGameDealerShift.create({
            data: {
                staffId,
                startedAt,
                endedAt,
                tableName,
                rakeChip,
                jpRakeChip,
                dealerChip,
            }
        })

        revalidatePath("/ring-games/dealer-shifts")
        return { success: true }
    } catch (e) {
        console.error(e)
        return {
            errors: {
                _form: ["作成に失敗しました"]
            }
        }
    }
}

export async function updateDealerShift(id: string, prevState: DealerShiftState, formData: FormData): Promise<DealerShiftState> {
    const staffId = formData.get("staffId") as string
    const dateStr = formData.get("date") as string // YYYY-MM-DD
    const startTimeStr = formData.get("startTime") as string // HH:MM
    const endTimeStr = formData.get("endTime") as string // HH:MM
    const tableName = formData.get("tableName") as string
    const rakeChipStr = formData.get("rakeChip") as string
    const jpRakeChipStr = formData.get("jpRakeChip") as string
    const dealerChipStr = formData.get("dealerChip") as string

    const errors: DealerShiftState["errors"] = {}

    if (!staffId) {
        errors.staffId = ["スタッフを選択してください"]
    }

    if (!dateStr) {
        errors.startedAt = ["日付を入力してください"]
    }

    if (!startTimeStr) {
        errors.startedAt = ["開始時間を入力してください"]
    }

    if (!tableName) {
        errors.tableName = ["テーブル名を入力してください"]
    }

    const rakeChip = rakeChipStr ? parseInt(rakeChipStr) : 0
    const jpRakeChip = jpRakeChipStr ? parseInt(jpRakeChipStr) : 0
    const dealerChip = dealerChipStr ? parseInt(dealerChipStr) : 0

    if (isNaN(rakeChip) || rakeChip < 0) {
        errors.rakeChip = ["レーキチップを正しく入力してください"]
    }
    if (isNaN(jpRakeChip) || jpRakeChip < 0) {
        errors.jpRakeChip = ["JPレーキチップを正しく入力してください"]
    }
    if (isNaN(dealerChip) || dealerChip < 0) {
        errors.dealerChip = ["ディーラーチップを正しく入力してください"]
    }

    if (Object.keys(errors).length > 0) {
        return { errors }
    }

    try {
        const startedAt = new Date(`${dateStr}T${startTimeStr}`)
        let endedAt: Date | null = null

        if (endTimeStr) {
            endedAt = new Date(`${dateStr}T${endTimeStr}`)
            // If end time is before start time, assume it's the next day
            if (endedAt < startedAt) {
                endedAt.setDate(endedAt.getDate() + 1)
            }
        }

        await prisma.ringGameDealerShift.update({
            where: { id },
            data: {
                staffId,
                startedAt,
                endedAt,
                tableName,
                rakeChip,
                jpRakeChip,
                dealerChip,
            }
        })

        revalidatePath("/ring-games/dealer-shifts")
        return { success: true }
    } catch (e) {
        console.error(e)
        return {
            errors: {
                _form: ["更新に失敗しました"]
            }
        }
    }
}

export async function deleteDealerShift(id: string) {
    try {
        await prisma.ringGameDealerShift.delete({
            where: { id }
        })
        revalidatePath("/ring-games/dealer-shifts")
        return { success: true }
    } catch (e) {
        console.error(e)
        return { success: false }
    }
}
