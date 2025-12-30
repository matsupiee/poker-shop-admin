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
import { Coins } from "lucide-react"
import { addRingGameEntry } from "@/app/actions/game-participation"
import { Badge } from "@/components/ui/badge"

type RingGameBuyInOption = {
    id: string
    ringGameType: "WEB_COIN" | "IN_STORE"
    chipAmount: number
    chargeAmount: number
}

interface RingGameParticipationDialogProps {
    visitId: string
    playerName: string
    ringGameBuyInOptions: RingGameBuyInOption[]
    onSuccess?: () => void
    disabled?: boolean
    defaultRingGameType?: "WEB_COIN" | "IN_STORE"
    trigger?: React.ReactNode
}

export function RingGameParticipationDialog({
    visitId,
    playerName,
    ringGameBuyInOptions,
    onSuccess,
    disabled,
    defaultRingGameType = "IN_STORE",
    trigger
}: RingGameParticipationDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [ringGameType, setRingGameType] = React.useState<"WEB_COIN" | "IN_STORE">(defaultRingGameType)
    const [selectedBuyInOptionId, setSelectedBuyInOptionId] = React.useState<string>("")
    const [chipAmount, setChipAmount] = React.useState<string>("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    // Reset selection when type changes
    React.useEffect(() => {
        setSelectedBuyInOptionId("")
        setChipAmount("")
    }, [ringGameType])

    const availableBuyInOptions = React.useMemo(() => {
        return ringGameBuyInOptions.filter(opt => opt.ringGameType === ringGameType)
    }, [ringGameBuyInOptions, ringGameType])

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
            const result = await addRingGameEntry(visitId, amount, ringGameType)
            if (!result.success) {
                setError(result.errors?._form?.[0] || "エラーが発生しました")
            } else {
                setOpen(false)
                setChipAmount("")
                setSelectedBuyInOptionId("")
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
                        <Coins className="w-4 h-4 mr-2" />
                        リング参加
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>リングゲーム参加登録 ({playerName})</DialogTitle>
                    <DialogDescription>
                        リングゲームの種別とバイインオプションを選択してください。
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="ringGameType">リングゲーム種別</Label>
                        <Select value={ringGameType} onValueChange={(val) => setRingGameType(val as "WEB_COIN" | "IN_STORE")}>
                            <SelectTrigger id="ringGameType">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="IN_STORE">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">
                                            店内リング
                                        </Badge>
                                        <span className="text-muted-foreground text-xs">(In-Store)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="WEB_COIN">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="default">
                                            WEBコイン
                                        </Badge>
                                        <span className="text-muted-foreground text-xs">(Web Coin)</span>
                                    </div>
                                </SelectItem>
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
                    <Button onClick={handleSubmit} disabled={isSubmitting || !chipAmount}>
                        {isSubmitting ? "処理中..." : "参加する"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
