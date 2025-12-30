"use client"

import { useActionState, useEffect, useState } from "react"
import { updateTournament } from "@/app/actions/tournaments"
import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit, Plus, Trash2 } from "lucide-react"
import { ChipEventOption, ChipEventOptionsForm } from "./chip-event-options-form"

const initialState = {
    errors: {},
    success: false
}

interface EditTournamentDialogProps {
    tournament: any // Using any for now to match the implicit types, ideally strictly typed
    onTournamentUpdated?: () => void
    children?: React.ReactNode
}

export function EditTournamentDialog({ tournament, onTournamentUpdated, children }: EditTournamentDialogProps) {
    const [open, setOpen] = useState(false)

    const handleSuccess = () => {
        setOpen(false)
        if (onTournamentUpdated) {
            onTournamentUpdated()
        }
    }

    // Checking if tournament is started to disable edit
    const isStarted = new Date() > new Date(tournament.startAt)
    if (isStarted) return null

    return (
        <Drawer open={open} onOpenChange={setOpen} direction="right">
            <DrawerTrigger asChild>
                {children ? children : (
                    <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                    </Button>
                )}
            </DrawerTrigger>
            <DrawerContent className="h-full sm:max-w-[760px] flex flex-col">
                <DrawerHeader className="flex-none border-b">
                    <DrawerTitle>トーナメント編集</DrawerTitle>
                    <DrawerDescription>
                        トーナメント情報を編集します。
                    </DrawerDescription>
                </DrawerHeader>
                <EditTournamentForm tournament={tournament} onSuccess={handleSuccess} />
            </DrawerContent>
        </Drawer>
    )
}

function EditTournamentForm({ tournament, onSuccess }: { tournament: any, onSuccess: () => void }) {
    const updateTournamentWithId = updateTournament.bind(null, tournament.id)
    const [state, action, isPending] = useActionState(updateTournamentWithId, initialState)
    const [prizes, setPrizes] = useState<Array<{ rank: number, amount: number }>>([])
    const [hasBounty, setHasBounty] = useState(false)
    const [chipEventOptions, setChipEventOptions] = useState<ChipEventOption[]>([])

    useEffect(() => {
        // Initialize prizes from tournament data
        if (tournament.tournamentPrizes && tournament.tournamentPrizes.length > 0) {
            setPrizes(tournament.tournamentPrizes.map((p: any) => ({
                rank: p.rank,
                amount: p.amount
            })))
        } else {
            setPrizes(Array.from({ length: 10 }, (_, i) => ({ rank: i + 1, amount: 0 })))
        }

        // Initialize chip event options
        if (tournament.tournamentChipEventOptions && tournament.tournamentChipEventOptions.length > 0) {
            setChipEventOptions(tournament.tournamentChipEventOptions.map((o: any) => ({
                eventType: o.eventType,
                name: o.name,
                chipAmount: o.chipAmount,
                chargeAmount: o.chargeAmount
            })))
        } else {
            setChipEventOptions([])
        }

        // Initialize bounty
        setHasBounty(!!tournament.tournamentBounty)
    }, [tournament])

    useEffect(() => {
        if (state.success) {
            onSuccess()
        }
    }, [state.success, onSuccess])

    const startAtDate = new Date(tournament.startAt)
    const entryClosesAtDate = new Date(tournament.entryClosesAt)

    // Format dates for inputs
    const defaultEventDate = startAtDate.getFullYear() + '-' + (startAtDate.getMonth() + 1).toString().padStart(2, '0') + '-' + startAtDate.getDate().toString().padStart(2, '0')

    // Manual time formatting to ensure HH:mm for input type="time"
    const formatTime = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        return `${hours}:${minutes}`
    }

    const defaultStartTime = formatTime(startAtDate)
    const defaultEntryClosesTime = formatTime(entryClosesAtDate)

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

        // Ensure the amount doesn't exceed the higher rank's amount
        if (index > 0) {
            const higherRankAmount = newPrizes[index - 1].amount
            if (amount > higherRankAmount) {
                return
            }
        }

        newPrizes[index].amount = amount

        // If we lowered this rank, we must ensure lower ranks are not higher than this one.
        for (let i = index + 1; i < newPrizes.length; i++) {
            if (newPrizes[i].amount > amount) {
                newPrizes[i].amount = amount
            } else {
                break
            }
        }

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

    return (
        <form action={action} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6">
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
                                defaultValue={defaultEventDate}
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
                                defaultValue={defaultStartTime}
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
                                defaultValue={defaultEntryClosesTime}
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
                                defaultValue={tournament.name}
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
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full border-dashed mt-2"
                                onClick={addPrize}
                            >
                                <Plus className="h-4 w-4 mr-1" /> 追加
                            </Button>
                        </div>
                        <input type="hidden" name="prizes" value={JSON.stringify(prizes)} />
                    </div>

                    {/* Chip Event Options Section */}
                    <ChipEventOptionsForm options={chipEventOptions} onChange={setChipEventOptions} />

                    {/* Bounty Section */}
                    <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="hasBounty"
                                name="hasBounty"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={hasBounty}
                                onChange={(e) => setHasBounty(e.target.checked)}
                            />
                            <Label htmlFor="hasBounty">バウンティあり</Label>
                        </div>

                        {hasBounty && (
                            <>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="bountyTicketCount" className="text-right">
                                        チケット枚数
                                    </Label>
                                    <div className="col-span-3">
                                        <Input
                                            id="bountyTicketCount"
                                            name="bountyTicketCount"
                                            type="number"
                                            min="1"
                                            defaultValue={tournament.tournamentBounty?.ticketCount ?? 1}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="bountyTotalAmount" className="text-right">
                                        バウンティ総額
                                    </Label>
                                    <div className="col-span-3 pb-2 relative">
                                        <span className="absolute left-3 top-[calc(50%-4px)] -translate-y-1/2 text-muted-foreground text-sm z-10">¥</span>
                                        <Input
                                            id="bountyTotalAmount"
                                            name="bountyTotalAmount"
                                            type="number"
                                            min="0"
                                            className="pl-7"
                                            placeholder="0"
                                            defaultValue={tournament.tournamentBounty?.totalAmount ?? 0}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {state.errors?._form && (
                        <div className="text-red-500 text-sm text-center">
                            {state.errors._form[0]}
                        </div>
                    )}
                </div>
            </div>
            <DrawerFooter className="flex-none border-t bg-background">
                <Button type="submit" disabled={isPending}>
                    {isPending ? "更新中..." : "更新"}
                </Button>
            </DrawerFooter>
        </form>
    )
}
