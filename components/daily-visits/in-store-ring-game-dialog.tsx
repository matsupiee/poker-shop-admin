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
import { Settings2, Plus } from "lucide-react"
import { addRingGameEntry, addRingGameChip } from "@/app/actions/game-participation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type InStoreRingBuyInOption = {
    id: string
    chipAmount: number
    chargeAmount: number
}

interface InStoreRingGameDialogProps {
    visitId: string
    playerName: string
    buyInOptions: InStoreRingBuyInOption[]
    existingEntry?: {
        id: string
        totalBuyIn: number
        totalCashOut: number
    }
    onSuccess?: () => void
    trigger?: React.ReactNode
}

export function InStoreRingGameDialog({
    visitId,
    playerName,
    buyInOptions,
    existingEntry,
    onSuccess,
    trigger
}: InStoreRingGameDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [selectedBuyInOptionId, setSelectedBuyInOptionId] = React.useState<string>("")
    const [chipAmount, setChipAmount] = React.useState<string>("")
    const [cashOutAmount, setCashOutAmount] = React.useState<string>("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [activeTab, setActiveTab] = React.useState<string>("buy-in")

    React.useEffect(() => {
        if (open) {
            setSelectedBuyInOptionId("")
            setChipAmount("")
            setCashOutAmount("")
            setError(null)
            setActiveTab("buy-in")
        }
    }, [open])

    const handleBuyInOptionChange = (value: string) => {
        setSelectedBuyInOptionId(value)
        const option = buyInOptions.find(opt => opt.id === value)
        if (option) {
            setChipAmount(option.chipAmount.toString())
        }
    }

    const handleSubmit = async () => {
        setError(null)
        setIsSubmitting(true)

        try {
            if (existingEntry) {
                // Management mode
                if (activeTab === "buy-in") {
                    const amount = parseInt(chipAmount)
                    if (isNaN(amount) || amount <= 0) {
                        setError("バイインオプションを選択してください")
                        setIsSubmitting(false)
                        return
                    }
                    const result = await addRingGameChip(existingEntry.id, "BUY_IN", amount, "IN_STORE")
                    if (!result.success) {
                        setError(result.errors?._form?.[0] || "エラーが発生しました")
                    } else {
                        handleSuccess()
                    }
                } else {
                    // Cash out
                    const amount = parseInt(cashOutAmount)
                    if (isNaN(amount) || amount < 0) {
                        setError("金額は0以上の数値を入力してください")
                        setIsSubmitting(false)
                        return
                    }
                    const result = await addRingGameChip(existingEntry.id, "CASH_OUT", amount, "IN_STORE")
                    if (!result.success) {
                        setError(result.errors?._form?.[0] || "エラーが発生しました")
                    } else {
                        handleSuccess()
                    }
                }
            } else {
                // Registration mode
                const amount = parseInt(chipAmount)
                if (isNaN(amount) || amount < 0) {
                    setError("バイインオプションを選択してください")
                    setIsSubmitting(false)
                    return
                }
                const result = await addRingGameEntry(visitId, amount, "IN_STORE")
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
        setSelectedBuyInOptionId("")
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
                        {isJoin ? "店内リング参加" : "店内リング管理"}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isJoin ? "店内リング参加登録" : "店内リング管理"} ({playerName})
                    </DialogTitle>
                    <DialogDescription>
                        {isJoin
                            ? "バイインオプションを選択してください。"
                            : "チップの追加バイインまたはキャッシュアウトを記録します。"}
                    </DialogDescription>
                </DialogHeader>

                {isJoin ? (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="buyInOption">バイインオプション</Label>
                            <Select value={selectedBuyInOptionId} onValueChange={handleBuyInOptionChange}>
                                <SelectTrigger id="buyInOption">
                                    <SelectValue placeholder="選択してください" />
                                </SelectTrigger>
                                <SelectContent>
                                    {buyInOptions.map((opt) => (
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
                                placeholder="オプションを選択してください"
                                value={chipAmount}
                                readOnly
                                className="bg-muted"
                            />
                        </div>
                    </div>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="buy-in">バイイン追加</TabsTrigger>
                            <TabsTrigger value="cash-out">キャッシュアウト</TabsTrigger>
                        </TabsList>
                        <TabsContent value="buy-in" className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="buyInOptionManage">バイインオプション</Label>
                                <Select value={selectedBuyInOptionId} onValueChange={handleBuyInOptionChange}>
                                    <SelectTrigger id="buyInOptionManage">
                                        <SelectValue placeholder="選択してください" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {buyInOptions.map((opt) => (
                                            <SelectItem key={opt.id} value={opt.id}>
                                                {opt.chipAmount.toLocaleString()}点 (¥{opt.chargeAmount.toLocaleString()})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="chipAmountManage">追加チップ量</Label>
                                <Input
                                    id="chipAmountManage"
                                    type="number"
                                    value={chipAmount}
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="cash-out" className="space-y-4 py-4">
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
                        </TabsContent>
                    </Tabs>
                )}

                {error && (
                    <p className="text-sm text-red-500 font-medium">{error}</p>
                )}

                <DialogFooter>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || (activeTab === "buy-in" ? !chipAmount : !cashOutAmount)}
                    >
                        {isSubmitting ? "処理中..." : (isJoin ? "参加する" : (activeTab === "buy-in" ? "追加する" : "キャッシュアウト"))}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
