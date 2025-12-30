"use client"

import { useState } from "react"
import { addTournamentAddOn } from "@/app/actions/game-participation"
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
import { PlusCircle } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useMemo } from "react"

export type TournamentChipEventOption = {
    id: string
    eventType: "ENTRY" | "ADD_CHIP"
    name: string
    chipAmount: number
    chargeAmount: number
}

interface AddOnDialogProps {
    tournamentEntryId: string
    playerName?: string
    chipEventOptions: TournamentChipEventOption[]
    onSuccess?: () => void
}

export function AddOnDialog({ tournamentEntryId, playerName, chipEventOptions, onSuccess }: AddOnDialogProps) {
    const [open, setOpen] = useState(false)
    const [selectedOptionId, setSelectedOptionId] = useState<string>("")
    const [chipAmount, setChipAmount] = useState<string>("")
    const [chargeAmount, setChargeAmount] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const addOnOptions = useMemo(() => {
        return chipEventOptions.filter(opt => opt.eventType === "ADD_CHIP")
    }, [chipEventOptions])

    const handleOptionChange = (value: string) => {
        setSelectedOptionId(value)
        const option = addOnOptions.find(opt => opt.id === value)
        if (option) {
            setChipAmount(option.chipAmount.toString())
            setChargeAmount(option.chargeAmount.toString())
        }
    }

    const handleSubmit = async () => {
        setError(null)
        setIsSubmitting(true)

        try {
            const chips = Number(chipAmount)
            const charge = Number(chargeAmount)

            if (isNaN(chips) || chips < 0) {
                setError("チップ量は0以上の数値を入力してください")
                setIsSubmitting(false)
                return
            }

            if (isNaN(charge) || charge < 0) {
                setError("請求額は0以上の数値を入力してください")
                setIsSubmitting(false)
                return
            }

            const result = await addTournamentAddOn(tournamentEntryId, chips, charge)

            if (result.errors) {
                setError(result.errors._form?.[0] || "エラーが発生しました")
            } else if (result.success) {
                setOpen(false)
                if (onSuccess) onSuccess()
            }
        } catch (e) {
            setError("予期せぬエラーが発生しました")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5" title="Add On">
                    <PlusCircle className="w-3.5 h-3.5 text-blue-500" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>ADD ON {playerName ? `- ${playerName}` : ""}</DialogTitle>
                    <DialogDescription>
                        項目を選択してチップを追加します。
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="option" className="text-right">
                            オプション
                        </Label>
                        <div className="col-span-3">
                            <Select value={selectedOptionId} onValueChange={handleOptionChange}>
                                <SelectTrigger id="option">
                                    <SelectValue placeholder="オプションを選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    {addOnOptions.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground">利用可能なアドオン設定がありません</div>
                                    ) : (
                                        addOnOptions.map((opt) => (
                                            <SelectItem key={opt.id} value={opt.id}>
                                                {opt.name} ({opt.chipAmount.toLocaleString()}点 / ¥{opt.chargeAmount.toLocaleString()})
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="chipAmount" className="text-right">
                            チップ量
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="chipAmount"
                                type="number"
                                value={chipAmount}
                                readOnly
                                className="bg-muted"
                                placeholder="自動入力されます"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="chargeAmount" className="text-right">
                            請求額
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="chargeAmount"
                                type="number"
                                value={chargeAmount}
                                readOnly
                                className="bg-muted"
                                placeholder="自動入力されます"
                            />
                        </div>
                    </div>
                    {error && (
                        <div className="text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !selectedOptionId}>
                        {isSubmitting ? "追加中..." : "追加"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
