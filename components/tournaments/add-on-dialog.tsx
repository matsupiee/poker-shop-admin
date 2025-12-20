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

interface AddOnDialogProps {
    tournamentEntryId: string
    playerName?: string
    onSuccess?: () => void
}

export function AddOnDialog({ tournamentEntryId, playerName, onSuccess }: AddOnDialogProps) {
    const [open, setOpen] = useState(false)
    const [chipAmount, setChipAmount] = useState<string>("10000")
    const [chargeAmount, setChargeAmount] = useState<string>("1000")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
                        チップを追加します。初期値: 10,000点 / 1,000円
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="chipAmount" className="text-right">
                            チップ量
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="chipAmount"
                                type="number"
                                value={chipAmount}
                                onChange={(e) => setChipAmount(e.target.value)}
                                min={0}
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
                                onChange={(e) => setChargeAmount(e.target.value)}
                                min={0}
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
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "追加中..." : "追加"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
