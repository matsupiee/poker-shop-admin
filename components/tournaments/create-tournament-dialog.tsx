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
import { Plus, Trash2 } from "lucide-react"

const initialState = {
    errors: {},
    success: false
}


interface CreateTournamentDialogProps {
    onTournamentCreated?: () => void
    children?: React.ReactNode
}

export function CreateTournamentDialog({ onTournamentCreated, children }: CreateTournamentDialogProps) {

    const [open, setOpen] = useState(false)
    const [state, action, isPending] = useActionState(createTournament, initialState)
    const [prizes, setPrizes] = useState<Array<{ rank: number, amount: number }>>(
        Array.from({ length: 10 }, (_, i) => ({ rank: i + 1, amount: 0 }))
    )

    useEffect(() => {
        if (state.success) {
            setOpen(false)
            setPrizes(Array.from({ length: 10 }, (_, i) => ({ rank: i + 1, amount: 0 }))) // Reset prizes
            if (onTournamentCreated) {
                onTournamentCreated()
            }
        }
    }, [state.success, onTournamentCreated])

    const addPrize = () => {
        setPrizes([...prizes, { rank: prizes.length + 1, amount: 0 }])
    }

    const removePrize = (index: number) => {
        const newPrizes = prizes.filter((_, i) => i !== index)
        // Re-calculate ranks
        const reordered = newPrizes.map((p, i) => ({ ...p, rank: i + 1 }))
        setPrizes(reordered)
    }

    const updatePrize = (index: number, amount: number) => {
        const newPrizes = [...prizes]
        newPrizes[index].amount = amount
        setPrizes(newPrizes)
    }

    const formatRank = (rank: number) => {
        switch (rank) {
            case 1: return "1st"
            case 2: return "2nd"
            case 3: return "3rd"
            default: return `${rank}th`
        }
    }

    // Default to today's date for convenience
    const today = new Date().toISOString().split('T')[0]

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children ? children : (
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" /> 新規作成
                    </Button>
                )}
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
                            <Label htmlFor="startTime" className="text-right">
                                開始時刻
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="startTime"
                                    name="startTime"
                                    type="time"
                                    defaultValue="19:00"
                                />
                                {state.errors?.startTime && (
                                    <p className="text-red-500 text-xs mt-1">{state.errors.startTime[0]}</p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="entryClosesTime" className="text-right">
                                締切時刻
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="entryClosesTime"
                                    name="entryClosesTime"
                                    type="time"
                                    defaultValue="21:10"
                                />
                                {state.errors?.entryClosesTime && (
                                    <p className="text-red-500 text-xs mt-1">{state.errors.entryClosesTime[0]}</p>
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

                        {/* Prize Section */}
                        <div className="space-y-4 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <Label>プライズ設定</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addPrize}
                                >
                                    <Plus className="h-4 w-4 mr-1" /> 追加
                                </Button>
                            </div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                {prizes.length === 0 && (
                                    <div className="text-center text-sm text-muted-foreground py-2">
                                        プライズ設定なし
                                    </div>
                                )}
                                {prizes.map((prize, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="w-16 flex-none flex items-center justify-center bg-muted h-10 rounded text-sm font-medium">
                                            {formatRank(index + 1)}
                                        </div>
                                        <div className="flex-1 relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">¥</span>
                                            <Input
                                                type="number"
                                                value={prize.amount === 0 ? '' : prize.amount}
                                                onChange={(e) => updatePrize(index, Number(e.target.value))}
                                                className="pl-7"
                                                placeholder="0"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removePrize(index)}
                                            className="text-muted-foreground hover:text-destructive shrink-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <input type="hidden" name="prizes" value={JSON.stringify(prizes)} />
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
