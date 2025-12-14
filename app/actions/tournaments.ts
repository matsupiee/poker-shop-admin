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

    try {
        const eventDate = new Date(eventDateStr)
        // Adjust for timezone if necessary, but usually standard date string 'YYYY-MM-DD' parses to UTC 00:00 or local depending on parsing.
        // `new Date("2023-01-01")` is UTC.
        // We probably want it to be stored as the date part mattering.
        // For simplicity, we store as is. 

        await prisma.tournament.create({
            data: {
                name,
                eventDate
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
