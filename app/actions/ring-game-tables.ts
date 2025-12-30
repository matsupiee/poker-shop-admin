"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { RingGameType } from "@/lib/generated/prisma/client"

const sitDownSchema = z.object({
    deskId: z.string(),
    staffId: z.string(),
})

export async function sitDownAtTable(formData: FormData) {
    const deskId = formData.get("deskId") as string
    const staffId = formData.get("staffId") as string

    const validation = sitDownSchema.safeParse({ deskId, staffId })

    if (!validation.success) {
        return { error: "入力内容が正しくありません" }
    }

    try {
        // Check if the staff is already sitting at another table
        const staffActiveShift = await prisma.ringGameDealerShift.findFirst({
            where: {
                staffId: staffId,
                endedAt: null,
            },
            include: {
                ringGameDesk: true
            }
        })

        if (staffActiveShift) {
            // Already sitting regardless of which table
            return { error: `このスタッフは既に ${staffActiveShift.ringGameDesk.name} に着席しています` }
        }

        // Check if there is already an active shift at this table
        const activeShift = await prisma.ringGameDealerShift.findFirst({
            where: {
                ringGameDeskId: deskId,
                endedAt: null,
            },
        })

        if (activeShift) {
            // Automatically end the previous shift at this table
            await prisma.ringGameDealerShift.update({
                where: { id: activeShift.id },
                data: { endedAt: new Date() },
            })
        }

        await prisma.ringGameDealerShift.create({
            data: {
                ringGameDeskId: deskId,
                staffId: staffId,
                startedAt: new Date(),
                ringGameType: RingGameType.IN_STORE,
            },
        })

        revalidatePath("/ring-games/tables")
        return { success: true }
    } catch (error) {
        console.error("Failed to sit down:", error)
        return { error: "エラーが発生しました" }
    }
}

export async function standUpFromTable(deskId: string) {
    try {
        const activeShift = await prisma.ringGameDealerShift.findFirst({
            where: {
                ringGameDeskId: deskId,
                endedAt: null,
            },
        })

        if (!activeShift) {
            return { error: "着席中のディーラーがいません" }
        }

        await prisma.ringGameDealerShift.update({
            where: { id: activeShift.id },
            data: { endedAt: new Date() },
        })

        revalidatePath("/ring-games/tables")
        return { success: true }
    } catch (error) {
        console.error("Failed to stand up:", error)
        return { error: "エラーが発生しました" }
    }
}

export async function createDefaultTables() {
    const count = await prisma.ringGameDesk.count()
    if (count === 0) {
        await prisma.ringGameDesk.createMany({
            data: [
                { name: "Table 1" },
                { name: "Table 2" },
                { name: "Table 3" },
                { name: "Table 4" },
            ]
        })
        revalidatePath("/ring-games/tables")
    }
}
