"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type CreatePlayerState = {
    errors?: {
        name?: string[]
        memberId?: string[]
        gameId?: string[]
        _form?: string[]
    }
    success?: boolean
}

export async function createPlayer(prevState: CreatePlayerState, formData: FormData): Promise<CreatePlayerState> {
    const name = formData.get("name") as string
    const memberId = formData.get("memberId") as string
    const gameId = formData.get("gameId") as string | null

    const errors: CreatePlayerState["errors"] = {}

    if (!name || name.trim().length === 0) {
        errors.name = ["名前を入力してください"]
    }

    if (!memberId || memberId.trim().length === 0) {
        errors.memberId = ["会員IDを入力してください"]
    }

    if (Object.keys(errors).length > 0) {
        return { errors }
    }

    try {
        await prisma.player.create({
            data: {
                name,
                memberId: parseInt(memberId),
                webCoinGameId: gameId && gameId.trim() !== "" ? gameId : null,
            }
        })

        revalidatePath("/players")
        return { success: true }
    } catch (e: any) {
        if (e.code === 'P2002') {
            return {
                errors: {
                    memberId: ["この会員IDは既に登録されています"]
                }
            }
        }
        return {
            errors: {
                _form: ["プレイヤーの登録に失敗しました。時間をおいて再度お試しください。"]
            }
        }
    }
}

export type UpdatePlayerState = {
    errors?: {
        name?: string[]
        memberId?: string[]
        gameId?: string[]
        _form?: string[]
    }
    success?: boolean
}

export async function updatePlayer(prevState: UpdatePlayerState, formData: FormData): Promise<UpdatePlayerState> {
    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const memberId = formData.get("memberId") as string
    const gameId = formData.get("gameId") as string | null

    const errors: UpdatePlayerState["errors"] = {}

    if (!id) {
        return { errors: { _form: ["プレイヤーIDが見つかりません"] } }
    }

    if (!name || name.trim().length === 0) {
        errors.name = ["名前を入力してください"]
    }

    if (!memberId || memberId.trim().length === 0) {
        errors.memberId = ["会員IDを入力してください"]
    }

    if (Object.keys(errors).length > 0) {
        return { errors }
    }

    try {
        await prisma.player.update({
            where: { id },
            data: {
                name,
                memberId: parseInt(memberId),
                webCoinGameId: gameId && gameId.trim() !== "" ? gameId : null,
            }
        })

        revalidatePath("/players")
        return { success: true }
    } catch (e: any) {
        console.error(e)
        if (e.code === 'P2002') {
            return {
                errors: {
                    memberId: ["この会員IDまたはゲームIDは既に登録されています"]
                }
            }
        }
        return {
            errors: {
                _form: ["プレイヤーの更新に失敗しました。時間をおいて再度お試しください。"]
            }
        }
    }
}
