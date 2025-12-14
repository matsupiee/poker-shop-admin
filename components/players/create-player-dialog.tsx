"use client"

import { useActionState, useEffect, useState } from "react"
import { createPlayer } from "@/app/actions/players"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus } from "lucide-react"

const initialState = {
    errors: {},
    success: false
}

export function CreatePlayerDialog() {
    const [open, setOpen] = useState(false)
    const [state, action, isPending] = useActionState(createPlayer, initialState)

    useEffect(() => {
        if (state.success) {
            setOpen(false)
            // Reset state/form if needed, but simplest is just close.
            // In a real app we might want to reset the form fields.
            // Since we are using standard form action, the fields might remain filled if we re-open.
            // But usually closing the dialog is enough for now.
        }
    }, [state.success])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <UserPlus className="mr-2 h-4 w-4" /> 新規登録
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>プレイヤー新規登録</DialogTitle>
                    <DialogDescription>
                        新しいプレイヤー情報を入力してください。
                    </DialogDescription>
                </DialogHeader>
                <form action={action}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="memberId" className="text-right">
                                会員ID
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="memberId"
                                    name="memberId"
                                    placeholder="例: P0001"
                                />
                                {state.errors?.memberId && (
                                    <p className="text-red-500 text-xs mt-1">{state.errors.memberId[0]}</p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                名前
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="例: 山田 太郎"
                                />
                                {state.errors?.name && (
                                    <p className="text-red-500 text-xs mt-1">{state.errors.name[0]}</p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="gameId" className="text-right">
                                ゲームID
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="gameId"
                                    name="gameId"
                                    placeholder="任意"
                                />
                                {state.errors?.gameId && (
                                    <p className="text-red-500 text-xs mt-1">{state.errors.gameId[0]}</p>
                                )}
                            </div>
                        </div>
                        {state.errors?._form && (
                            <div className="text-red-500 text-sm text-center">
                                {state.errors._form[0]}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "登録中..." : "登録"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
