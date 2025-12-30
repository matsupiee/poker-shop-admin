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
import { Coins, Trophy } from "lucide-react"
import { addRingGameEntry, addTournamentEntry } from "@/app/actions/game-participation"

// Types for the partial tournament data we need
type AvailableTournament = {
    id: string
    name: string
    startAt: Date | string
    entryClosesAt: Date | string
}

type RingGameBuyInOption = {
    id: string
    ringGameType: "WEB_COIN" | "IN_STORE"
    chipAmount: number
    chargeAmount: number
}

interface AssignGameDialogProps {
    visitId: string
    playerName: string
    tournaments: AvailableTournament[]
    ringGameBuyInOptions: RingGameBuyInOption[]
    onSuccess?: () => void
    disabled?: boolean
}

export function AssignGameDialog({ visitId, playerName, tournaments, ringGameBuyInOptions, onSuccess, disabled }: AssignGameDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [mode, setMode] = React.useState<"tournament" | "ring">("tournament")

    const [ringGameType, setRingGameType] = React.useState<"WEB_COIN" | "IN_STORE">("IN_STORE")
    const [selectedTournamentId, setSelectedTournamentId] = React.useState<string>("")
    const [chipAmount, setChipAmount] = React.useState<string>("")
    const [selectedBuyInOptionId, setSelectedBuyInOptionId] = React.useState<string>("")
    const [entrySource, setEntrySource] = React.useState<"BUY_IN" | "FREE" | "SATELLITE">("BUY_IN")
    const [paymentAmount, setPaymentAmount] = React.useState<string>("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    // Filter options based on selected ring game type
    const availableBuyInOptions = React.useMemo(() => {
        return ringGameBuyInOptions.filter(opt => opt.ringGameType === ringGameType)
    }, [ringGameBuyInOptions, ringGameType])

    // Reset buy-in selection when type changes
    React.useEffect(() => {
        if (mode === "ring") {
            setSelectedBuyInOptionId("")
            setChipAmount("")
        }
    }, [ringGameType, mode])

    const handleBuyInOptionChange = (value: string) => {
        setSelectedBuyInOptionId(value)
        const option = ringGameBuyInOptions.find(opt => opt.id === value)
        if (option) {
            setChipAmount(option.chipAmount.toString())
        }
    }

    const handleSubmit = async () => {
        setError(null)
        setIsSubmitting(true)

        const amount = parseInt(chipAmount)
        if (isNaN(amount) || amount < 0) {
            setError("チップ量は0以上の数値を入力してください")
            setIsSubmitting(false)
            return
        }

        try {
            if (mode === "tournament") {
                if (!selectedTournamentId) {
                    setError("トーナメントを選択してください")
                    setIsSubmitting(false)
                    return
                }
                const payment = parseInt(paymentAmount)
                if (isNaN(payment) || payment < 0) {
                    setError("支払い金額は0以上の数値を入力してください")
                    setIsSubmitting(false)
                    return
                }

                const result = await addTournamentEntry(
                    visitId,
                    selectedTournamentId,
                    amount,
                    entrySource,
                    payment
                )
                if (!result.success) {
                    setError(result.errors?._form?.[0] || "エラーが発生しました")
                } else {
                    setOpen(false)
                    setChipAmount("")
                    if (onSuccess) onSuccess()
                }
            } else {
                const result = await addRingGameEntry(visitId, amount, ringGameType)
                if (!result.success) {
                    setError(result.errors?._form?.[0] || "エラーが発生しました")
                } else {
                    setOpen(false)
                    setChipAmount("")
                    if (onSuccess) onSuccess()
                }
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
                <Button variant="outline" size="sm" className="h-8" disabled={disabled}>
                    ゲーム参加
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>ゲーム参加登録 ({playerName})</DialogTitle>
                    <DialogDescription>
                        参加するゲームとチップ量を選択してください。
                    </DialogDescription>
                </DialogHeader>

                <div className="flex w-full mb-4 bg-muted p-1 rounded-lg">
                    <button
                        className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-colors ${mode === "tournament"
                            ? "bg-background shadow-sm text-foreground"
                            : "text-muted-foreground hover:bg-background/50"
                            }`}
                        onClick={() => setMode("tournament")}
                    >
                        <Trophy className="w-4 h-4 mr-2" />
                        トーナメント
                    </button>
                    <button
                        className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-colors ${mode === "ring"
                            ? "bg-background shadow-sm text-foreground"
                            : "text-muted-foreground hover:bg-background/50"
                            }`}
                        onClick={() => setMode("ring")}
                    >
                        <Coins className="w-4 h-4 mr-2" />
                        リングゲーム
                    </button>
                </div>

                <div className="grid gap-4 py-4">
                    {mode === "tournament" ? (
                        <div className="grid gap-4">
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
                                <Label htmlFor="entrySource">参加区分</Label>
                                <Select value={entrySource} onValueChange={(val) => setEntrySource(val as "BUY_IN" | "FREE" | "SATELLITE")}>
                                    <SelectTrigger id="entrySource">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BUY_IN">通常参加 (BUY_IN)</SelectItem>
                                        <SelectItem value="FREE">無料参加 (FREE)</SelectItem>
                                        <SelectItem value="SATELLITE">サテライト通過 (SATELLITE)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="paymentAmount">支払い金額</Label>
                                <Input
                                    id="paymentAmount"
                                    type="number"
                                    placeholder="例: 5000"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="ringGameType">リングゲーム種別</Label>
                                <Select value={ringGameType} onValueChange={(val) => setRingGameType(val as "WEB_COIN" | "IN_STORE")}>
                                    <SelectTrigger id="ringGameType">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="IN_STORE">店内リング (In-Store)</SelectItem>
                                        <SelectItem value="WEB_COIN">Webコイン (Web Coin)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="buyInOption">バイインオプション</Label>
                                <Select value={selectedBuyInOptionId} onValueChange={handleBuyInOptionChange}>
                                    <SelectTrigger id="buyInOption">
                                        <SelectValue placeholder="選択してください" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableBuyInOptions.map((opt) => (
                                            <SelectItem key={opt.id} value={opt.id}>
                                                {opt.chipAmount.toLocaleString()}点 (¥{opt.chargeAmount.toLocaleString()})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="chipAmount">開始チップ量</Label>
                        <Input
                            id="chipAmount"
                            type="number"
                            placeholder="例: 10000"
                            value={chipAmount}
                            readOnly={mode === "ring"}
                            className={mode === "ring" ? "bg-muted" : ""}
                            onChange={(e) => {
                                if (mode !== "ring") {
                                    setChipAmount(e.target.value)
                                }
                            }}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 font-medium">{error}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isSubmitting || (mode === "tournament" && (!selectedTournamentId || !paymentAmount)) || !chipAmount}>
                        {isSubmitting ? "処理中..." : "参加する"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
