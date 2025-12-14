"use client"

import { useActionState, useEffect, useState } from "react"
import { createTournament } from "@/app/actions/tournaments"
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
import { Plus } from "lucide-react"

const initialState = {
    errors: {},
    success: false
}

export function CreateTournamentDialog() {
    const [open, setOpen] = useState(false)
    const [state, action, isPending] = useActionState(createTournament, initialState)

    useEffect(() => {
        if (state.success) {
            setOpen(false)
        }
    }, [state.success])

    // Default to today's date for convenience
    const today = new Date().toISOString().split('T')[0]

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" /> 新規作成
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>トーナメント新規作成</DialogTitle>
                    <DialogDescription>
                        新しいトーナメントを作成します。
                    </DialogDescription>
                </DialogHeader>
                <form action={action}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="eventDate" className="text-right">
                                開催日
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="eventDate"
                                    name="eventDate"
                                    type="date"
                                    defaultValue={today}
                                />
                                {state.errors?.eventDate && (
                                    <p className="text-red-500 text-xs mt-1">{state.errors.eventDate[0]}</p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                大会名
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="例: デイリーハイパーターボ"
                                />
                                {state.errors?.name && (
                                    <p className="text-red-500 text-xs mt-1">{state.errors.name[0]}</p>
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
                            {isPending ? "作成中..." : "作成"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
