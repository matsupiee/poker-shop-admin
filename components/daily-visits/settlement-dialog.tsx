"use client"

import * as React from "react"
import { Calculator, CheckCircle2, Loader2, Receipt } from "lucide-react"
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
import { cn } from "@/lib/utils"
import { getVisitSettlementDetails, settleVisit } from "@/app/actions/visits"

interface SettlementDialogProps {
    visitId: string
    playerName: string
    isSettled?: boolean
    onSuccess?: () => void
}

type BreakdownItem = {
    type: string
    label: string
    amount: number
}

export function SettlementDialog({ visitId, playerName, isSettled, onSuccess }: SettlementDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [breakdown, setBreakdown] = React.useState<BreakdownItem[]>([])
    const [netAmount, setNetAmount] = React.useState(0)
    const [submitting, setSubmitting] = React.useState(false)

    const [error, setError] = React.useState<string | null>(null)

    // Calculate details when dialog opens
    React.useEffect(() => {
        if (open) {
            setLoading(true)
            setError(null)
            getVisitSettlementDetails(visitId)
                .then((data) => {
                    setBreakdown(data.items)
                    setNetAmount(data.netAmount)
                })
                .catch((err) => {
                    console.error(err)
                    setError("明細の取得に失敗しました")
                })
                .finally(() => {
                    setLoading(false)
                })
        }
    }, [open, visitId])

    const handleSettle = async () => {
        setSubmitting(true)
        setError(null)
        try {
            const result = await settleVisit(visitId, breakdown, netAmount)
            if (result.success) {
                setOpen(false)
                onSuccess?.()
            } else {
                setError(result.error || "エラーが発生しました")
            }
        } catch (error) {
            setError("予期せぬエラーが発生しました")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant={isSettled ? "secondary" : "default"}
                    size="sm"
                    className={cn(isSettled && "bg-green-100 text-green-700 hover:bg-green-200")}
                >
                    {isSettled ? (
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                    ) : (
                        <Receipt className="w-4 h-4 mr-1" />
                    )}
                    {isSettled ? "決済済" : "会計"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>お会計プレビュー</DialogTitle>
                    <DialogDescription>
                        {playerName} 様の本日のお会計詳細です。
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                                    {error}
                                </div>
                            )}
                            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                                <div className="p-4 space-y-2">
                                    {breakdown.length === 0 ? (
                                        <p className="text-center text-sm text-muted-foreground py-2">
                                            明細はありません
                                        </p>
                                    ) : (
                                        breakdown.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">{item.label}</span>
                                                <span className={cn(
                                                    "font-mono font-medium",
                                                    item.amount > 0 ? "text-green-600" : "text-red-500"
                                                )}>
                                                    {item.amount > 0 ? "+" : ""}
                                                    {item.amount.toLocaleString()}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="p-4 border-t bg-muted/50 rounded-b-lg flex justify-between items-center">
                                    <span className="font-bold">合計</span>
                                    <span className={cn(
                                        "text-xl font-bold font-mono",
                                        netAmount > 0 ? "text-green-600" : "text-red-500"
                                    )}>
                                        {netAmount > 0 ? "+" : ""}
                                        {netAmount.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="text-xs text-muted-foreground text-center">
                                {netAmount < 0 ? (
                                    <span>プレイヤーが <span className="font-bold text-red-500">{Math.abs(netAmount).toLocaleString()}</span> 円支払います</span>
                                ) : netAmount > 0 ? (
                                    <span>お店が <span className="font-bold text-green-600">{netAmount.toLocaleString()}</span> 円支払います</span>
                                ) : (
                                    <span>精算額はありません</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button variant="ghost" onClick={() => setOpen(false)}>キャンセル</Button>
                    <Button
                        onClick={handleSettle}
                        disabled={loading || submitting}
                        className={cn(netAmount > 0 ? "bg-green-600 hover:bg-green-700" : "")}
                    >
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        決済を確定する
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
