"use client"

import * as React from "react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Settings2 } from "lucide-react"
import { addTournamentEntry, addTournamentAddOn } from "@/app/actions/game-participation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TournamentChipEventOption = {
    id: string
    eventType: "ENTRY" | "ADD_CHIP"
    name: string
    chipAmount: number
    chargeAmount: number
}

type AvailableTournament = {
    id: string
    name: string
    startAt: Date | string
    entryClosesAt: Date | string
    tournamentChipEventOptions: TournamentChipEventOption[]
}

interface TournamentDialogProps {
    visitId: string
    playerName: string
    tournaments: AvailableTournament[]
    existingEntryId?: string
    onSuccess?: () => void
    disabled?: boolean
    defaultTournamentId?: string
    trigger?: React.ReactNode
}

export function TournamentDialog({
    visitId,
    playerName,
    tournaments,
    existingEntryId,
    onSuccess,
    disabled,
    defaultTournamentId = "",
    trigger
}: TournamentDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [selectedTournamentId, setSelectedTournamentId] = React.useState<string>(defaultTournamentId)
    const [selectedOptionId, setSelectedOptionId] = React.useState<string>("")
    const [chipAmount, setChipAmount] = React.useState<string>("")
    const [paymentAmount, setPaymentAmount] = React.useState<string>("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    // Sync state when dialog opens
    React.useEffect(() => {
        if (open) {
            setSelectedTournamentId(defaultTournamentId)
            setSelectedOptionId("")
            setChipAmount("")
            setPaymentAmount("")
            setError(null)
        }
    }, [open, defaultTournamentId])

    // Reset selection when tournament changes
    React.useEffect(() => {
        setSelectedOptionId("")
        setChipAmount("")
        setPaymentAmount("")
    }, [selectedTournamentId])

    const currentTournament = React.useMemo(() => {
        return tournaments.find(t => t.id === selectedTournamentId)
    }, [tournaments, selectedTournamentId])

    const availableOptions = React.useMemo(() => {
        if (!currentTournament) return []
        // If not joined yet, only show ENTRY options.
        // If already joined, show both ENTRY (for Re-entry) and ADD_CHIP (for Add-on).
        if (!existingEntryId) {
            return currentTournament.tournamentChipEventOptions.filter(opt => opt.eventType === "ENTRY")
        }
        return currentTournament.tournamentChipEventOptions
    }, [currentTournament, existingEntryId])

    const selectedOption = React.useMemo(() => {
        return availableOptions.find(opt => opt.id === selectedOptionId)
    }, [availableOptions, selectedOptionId])

    const handleOptionChange = (value: string) => {
        setSelectedOptionId(value)
        const option = availableOptions.find(opt => opt.id === value)
        if (option) {
            setChipAmount(option.chipAmount.toString())
            setPaymentAmount(option.chargeAmount.toString())
        }
    }

    const handleSubmit = async () => {
        setError(null)
        setIsSubmitting(true)

        if (!selectedTournamentId) {
            setError("トーナメントを選択してください")
            setIsSubmitting(false)
            return
        }

        if (!selectedOption) {
            setError("オプションを選択してください")
            setIsSubmitting(false)
            return
        }

        const amount = parseInt(chipAmount)
        const payment = parseInt(paymentAmount)

        if (isNaN(amount) || amount < 0) {
            setError("チップ量は0以上の数値を入力してください")
            setIsSubmitting(false)
            return
        }

        if (isNaN(payment) || payment < 0) {
            setError("支払い金額は0以上の数値を入力してください")
            setIsSubmitting(false)
            return
        }

        try {
            let result
            if (selectedOption.eventType === "ENTRY") {
                result = await addTournamentEntry(
                    visitId,
                    selectedTournamentId,
                    amount,
                    payment
                )
            } else {
                if (!existingEntryId) {
                    setError("エントリーが見つかりません")
                    setIsSubmitting(false)
                    return
                }
                result = await addTournamentAddOn(
                    existingEntryId,
                    amount,
                    payment
                )
            }

            if (!result.success) {
                setError(result.errors?._form?.[0] || "エラーが発生しました")
            } else {
                setOpen(false)
                if (onSuccess) onSuccess()
            }
        } catch (e) {
            setError("予期せぬエラーが発生しました")
        } finally {
            setIsSubmitting(false)
        }
    }

    const isJoin = !existingEntryId

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="h-8" disabled={disabled}>
                        {isJoin ? <Plus className="w-4 h-4 mr-2" /> : <Settings2 className="w-4 h-4 mr-2" />}
                        {isJoin ? "トーナメント参加" : "トーナメント管理"}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isJoin ? "トーナメント参加登録" : "トーナメント管理"} ({playerName})
                    </DialogTitle>
                    <DialogDescription>
                        {isJoin
                            ? "参加するトーナメントとエントリーオプションを選択してください。"
                            : "オプションを選択して追加またはリエントリーを行います。"}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">

                    <div className="grid gap-2">
                        <Label htmlFor="option">オプション選択</Label>
                        <Select
                            value={selectedOptionId}
                            onValueChange={handleOptionChange}
                            disabled={!selectedTournamentId}
                        >
                            <SelectTrigger id="option">
                                <SelectValue placeholder={selectedTournamentId ? "オプションを選択" : "先にトーナメントを選択してください"} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableOptions.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                        利用可能なオプションがありません
                                    </div>
                                ) : (
                                    availableOptions.map((opt) => (
                                        <SelectItem key={opt.id} value={opt.id}>
                                            <div className="flex justify-between items-center w-full gap-2">
                                                <span>{opt.name}</span>
                                                <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">
                                                    {opt.eventType === "ENTRY" ? "Entry" : "Add-on"}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                                {opt.chipAmount.toLocaleString()}点 / ¥{opt.chargeAmount.toLocaleString()}
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="paymentAmount">支払い金額</Label>
                        <Input
                            id="paymentAmount"
                            type="number"
                            placeholder="自動入力"
                            value={paymentAmount}
                            readOnly
                            className="bg-muted"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="chipAmount">チップ量</Label>
                        <Input
                            id="chipAmount"
                            type="number"
                            placeholder="自動入力"
                            value={chipAmount}
                            readOnly
                            className="bg-muted"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 font-medium">{error}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !selectedTournamentId || !selectedOptionId}>
                        {isSubmitting ? "処理中..." : (selectedOption?.eventType === "ENTRY" ? (isJoin ? "参加する" : "リエントリー") : "アドオン追加")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
