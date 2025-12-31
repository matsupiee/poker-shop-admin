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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings2, Plus } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { addRingGameEntry, addRingGameChip } from "@/app/actions/game-participation"

interface WebCoinRingGameDialogProps {
    visitId: string
    playerName: string
    existingEntry?: {
        id: string
        totalBuyIn: number
        totalCashOut: number
    }
    onSuccess?: () => void
    trigger?: React.ReactNode
}

export function WebCoinRingGameDialog({
    visitId,
    playerName,
    existingEntry,
    onSuccess,
    trigger
}: WebCoinRingGameDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [chipAmount, setChipAmount] = React.useState<string>("")
    const [cashOutAmount, setCashOutAmount] = React.useState<string>("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [eventType, setEventType] = React.useState<string>("BUY_IN")

    React.useEffect(() => {
        if (open) {
            setChipAmount("")
            setCashOutAmount("")
            setError(null)
            setEventType("BUY_IN")
        }
    }, [open])

    const handleSubmit = async () => {
        setError(null)
        setIsSubmitting(true)

        try {
            if (existingEntry) {
                // Management mode
                const amount = eventType === "CASH_OUT" ? parseInt(cashOutAmount) : parseInt(chipAmount)
                if (isNaN(amount) || amount < 0) {
                    setError("金額を入力してください")
                    setIsSubmitting(false)
                    return
                }
                const result = await addRingGameChip(existingEntry.id, eventType, amount, "WEB_COIN")
                if (!result.success) {
                    setError(result.errors?._form?.[0] || "エラーが発生しました")
                } else {
                    handleSuccess()
                }
            } else {
                // Registration mode
                const amount = parseInt(chipAmount)
                if (isNaN(amount) || amount < 0) {
                    setError("チップ量を入力してください")
                    setIsSubmitting(false)
                    return
                }
                const result = await addRingGameEntry(visitId, amount, "WEB_COIN")
                if (!result.success) {
                    setError(result.errors?._form?.[0] || "エラーが発生しました")
                } else {
                    handleSuccess()
                }
            }
        } catch (e) {
            setError("予期せぬエラーが発生しました")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSuccess = () => {
        setOpen(false)
        setChipAmount("")
        setCashOutAmount("")
        if (onSuccess) onSuccess()
    }

    const isJoin = !existingEntry

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="h-8">
                        {isJoin ? <Plus className="w-4 h-4 mr-2" /> : <Settings2 className="w-4 h-4 mr-2" />}
                        {isJoin ? "WEBリング参加" : "WEBリング管理"}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isJoin ? "WEBコインリング参加登録" : "WEBコインリング管理"} ({playerName})
                    </DialogTitle>
                    <DialogDescription>
                        {isJoin
                            ? "開始時のチップ量を入力してください。"
                            : "チップの追加(バイイン)またはキャッシュアウトを記録します。"}
                    </DialogDescription>
                </DialogHeader>

                {isJoin ? (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="chipAmount">開始チップ量</Label>
                            <Input
                                id="chipAmount"
                                type="number"
                                placeholder="例: 20000"
                                value={chipAmount}
                                onChange={(e) => setChipAmount(e.target.value)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="eventType">種別</Label>
                            <Select value={eventType} onValueChange={setEventType}>
                                <SelectTrigger id="eventType">
                                    <SelectValue placeholder="種別を選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BUY_IN">バイイン追加</SelectItem>
                                    <SelectItem value="CASH_OUT">キャッシュアウト</SelectItem>
                                    <SelectItem value="GIFT">ギフト（プレゼント）</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {eventType === "CASH_OUT" ? (
                            <div className="grid gap-2">
                                <Label htmlFor="cashOutAmount">キャッシュアウト額 (チップ量)</Label>
                                <Input
                                    id="cashOutAmount"
                                    type="number"
                                    placeholder="例: 15000"
                                    value={cashOutAmount}
                                    onChange={(e) => setCashOutAmount(e.target.value)}
                                />
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                <Label htmlFor="chipAmountManage">
                                    {eventType === "BUY_IN" ? "追加チップ量" : "ギフトチップ量"}
                                </Label>
                                <Input
                                    id="chipAmountManage"
                                    type="number"
                                    placeholder="例: 10000"
                                    value={chipAmount}
                                    onChange={(e) => setChipAmount(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <p className="text-sm text-red-500 font-medium">{error}</p>
                )}

                <DialogFooter>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || (eventType === "CASH_OUT" ? !cashOutAmount : !chipAmount)}
                    >
                        {isSubmitting ? "処理中..." : (isJoin ? "参加する" : "登録する")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
