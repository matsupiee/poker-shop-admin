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
import { Trophy } from "lucide-react"
import { addTournamentEntry } from "@/app/actions/game-participation"
import { Badge } from "@/components/ui/badge"

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

interface TournamentParticipationDialogProps {
    visitId: string
    playerName: string
    tournaments: AvailableTournament[]
    onSuccess?: () => void
    disabled?: boolean
    defaultTournamentId?: string
    trigger?: React.ReactNode
}

export function TournamentParticipationDialog({
    visitId,
    playerName,
    tournaments,
    onSuccess,
    disabled,
    defaultTournamentId = "",
    trigger
}: TournamentParticipationDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [selectedTournamentId, setSelectedTournamentId] = React.useState<string>(defaultTournamentId)
    const [selectedTournamentOptionId, setSelectedTournamentOptionId] = React.useState<string>("")
    const [chipAmount, setChipAmount] = React.useState<string>("")
    const [paymentAmount, setPaymentAmount] = React.useState<string>("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    // Reset selection when tournament changes
    React.useEffect(() => {
        setSelectedTournamentOptionId("")
        setChipAmount("")
        setPaymentAmount("")
    }, [selectedTournamentId])

    const availableTournamentOptions = React.useMemo(() => {
        const tournament = tournaments.find(t => t.id === selectedTournamentId)
        if (!tournament) return []
        return tournament.tournamentChipEventOptions.filter(opt => opt.eventType === "ENTRY")
    }, [tournaments, selectedTournamentId])

    const handleTournamentOptionChange = (value: string) => {
        setSelectedTournamentOptionId(value)
        const option = availableTournamentOptions.find(opt => opt.id === value)
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
            const result = await addTournamentEntry(
                visitId,
                selectedTournamentId,
                amount,
                payment
            )
            if (!result.success) {
                setError(result.errors?._form?.[0] || "エラーが発生しました")
            } else {
                setOpen(false)
                setChipAmount("")
                setPaymentAmount("")
                setSelectedTournamentOptionId("")
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
                {trigger || (
                    <Button variant="outline" size="sm" className="h-8" disabled={disabled}>
                        <Trophy className="w-4 h-4 mr-2" />
                        トーナメント参加
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>トーナメント参加登録 ({playerName})</DialogTitle>
                    <DialogDescription>
                        参加するトーナメントとエントリーオプションを選択してください。
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="tournament">トーナメント選択</Label>
                        {tournaments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                開催予定のトーナメントがありません。
                            </p>
                        ) : (
                            <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
                                <SelectTrigger id="tournament">
                                    <SelectValue placeholder="トーナメントを選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tournaments.map((t) => {
                                        const isClosed = new Date() > new Date(t.entryClosesAt)
                                        return (
                                            <SelectItem key={t.id} value={t.id} disabled={isClosed}>
                                                {t.name} {isClosed ? "(締切)" : ""}
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="tournamentOption">エントリーオプション</Label>
                        <Select value={selectedTournamentOptionId} onValueChange={handleTournamentOptionChange} disabled={!selectedTournamentId}>
                            <SelectTrigger id="tournamentOption">
                                <SelectValue placeholder={selectedTournamentId ? "オプションを選択" : "先にトーナメントを選択してください"} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTournamentOptions.map((opt) => (
                                    <SelectItem key={opt.id} value={opt.id}>
                                        {opt.name} ({opt.chipAmount.toLocaleString()}点 / ¥{opt.chargeAmount.toLocaleString()})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="paymentAmount">支払い金額</Label>
                        <Input
                            id="paymentAmount"
                            type="number"
                            placeholder="オプションを選択すると自動入力されます"
                            value={paymentAmount}
                            readOnly
                            className="bg-muted"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="chipAmount">開始チップ量</Label>
                        <Input
                            id="chipAmount"
                            type="number"
                            placeholder="オプションを選択すると自動入力されます"
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
                    <Button onClick={handleSubmit} disabled={isSubmitting || !selectedTournamentId || !paymentAmount || !chipAmount}>
                        {isSubmitting ? "処理中..." : "参加する"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
