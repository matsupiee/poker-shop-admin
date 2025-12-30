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
import { Coins, LogOut, Plus, Settings2 } from "lucide-react"
import { addRingGameChip } from "@/app/actions/game-participation"

interface RingGameControlProps {
    ringGameEntryId: string
    playerName: string
    currentBuyIn: number
    currentCashOut: number
    onSuccess?: () => void
}

export function RingGameControl({ ringGameEntryId, playerName, currentBuyIn, currentCashOut, onSuccess }: RingGameControlProps) {
    const [open, setOpen] = React.useState(false)
    const [amount, setAmount] = React.useState("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [activeTab, setActiveTab] = React.useState("buy-in")

    const handleSubmit = async () => {
        setError(null)
        setIsSubmitting(true)

        const value = parseInt(amount)
        if (isNaN(value) || value <= 0) {
            setError("金額は1以上の数値を入力してください")
            setIsSubmitting(false)
            return
        }

        try {
            const type = activeTab === "buy-in" ? "BUY_IN" : "CASH_OUT"
            const result = await addRingGameChip(ringGameEntryId, type, value)

            if (!result.success) {
                setError(result.errors?._form?.[0] || "エラーが発生しました")
            } else {
                setOpen(false)
                setAmount("")
                if (onSuccess) onSuccess()
            }
        } catch (e) {
            setError("予期せぬエラーが発生しました")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Reset state when opening/changing tabs
    React.useEffect(() => {
        if (!open) {
            setAmount("")
            setError(null)
            setActiveTab("buy-in")
        }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Settings2 className="h-4 w-4" />
                    <span className="sr-only">リングゲーム管理</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>リングゲーム管理 ({playerName})</DialogTitle>
                    <DialogDescription>
                        チップの追加購入(リバイ)またはキャッシュアウトを記録します。
                    </DialogDescription>
                </DialogHeader>

                <div className="w-full">
                    <div className="grid w-full grid-cols-2 mb-4 bg-muted p-1 rounded-lg">
                        <button
                            className={`text-sm font-medium py-1.5 rounded-md transition-all ${activeTab === "buy-in" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                                }`}
                            onClick={() => setActiveTab("buy-in")}
                        >
                            バイイン追加
                        </button>
                        <button
                            className={`text-sm font-medium py-1.5 rounded-md transition-all ${activeTab === "cash-out" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                                }`}
                            onClick={() => setActiveTab("cash-out")}
                        >
                            キャッシュアウト
                        </button>
                    </div>

                    <div className="py-4">
                        <div className="flex items-center justify-between mb-4 px-2 py-2 bg-muted rounded-md text-sm">
                            <div className="flex flex-col">
                                <span className="text-muted-foreground">現在の総バイイン</span>
                                <span className="font-medium">{currentBuyIn.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-muted-foreground">現在の総キャッシュアウト</span>
                                <span className="font-medium">{currentCashOut.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">
                                {activeTab === "buy-in" ? "追加バイイン額" : "キャッシュアウト額"}
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="例: 10000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 font-medium mt-2">{error}</p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !amount}>
                        {isSubmitting ? "処理中..." : activeTab === "buy-in" ? "追加する" : "キャッシュアウト"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
