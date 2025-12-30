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
import { Coins, Settings2, Plus, ArrowRightLeft } from "lucide-react"
import { addRingGameEntry, addRingGameChip } from "@/app/actions/game-participation"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type RingGameBuyInOption = {
    id: string
    ringGameType: "WEB_COIN" | "IN_STORE"
    chipAmount: number
    chargeAmount: number
}

interface RingGameDialogProps {
    visitId: string
    playerName: string
    ringGameType: "WEB_COIN" | "IN_STORE"
    ringGameBuyInOptions: RingGameBuyInOption[]
    existingEntry?: {
        id: string
        totalBuyIn: number
        totalCashOut: number
    }
    onSuccess?: () => void
    trigger?: React.ReactNode
}

export function RingGameDialog({
    visitId,
    playerName,
    ringGameType: initialType,
    ringGameBuyInOptions,
    existingEntry,
    onSuccess,
    trigger
}: RingGameDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [ringGameType, setRingGameType] = React.useState<"WEB_COIN" | "IN_STORE">(initialType)
    const [selectedBuyInOptionId, setSelectedBuyInOptionId] = React.useState<string>("")
    const [chipAmount, setChipAmount] = React.useState<string>("")
    const [cashOutAmount, setCashOutAmount] = React.useState<string>("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [activeTab, setActiveTab] = React.useState<string>("buy-in")

    // Sync ringGameType with initialType when props change or dialog opens
    React.useEffect(() => {
        if (open) {
            setRingGameType(initialType)
            setSelectedBuyInOptionId("")
            setChipAmount("")
            setCashOutAmount("")
            setError(null)
            setActiveTab("buy-in")
        }
    }, [open, initialType])

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

        try {
            if (existingEntry) {
                // Management mode
                if (activeTab === "buy-in") {
                    const amount = parseInt(chipAmount)
                    const option = ringGameBuyInOptions.find(opt => opt.id === selectedBuyInOptionId)
                    if (isNaN(amount) || amount <= 0) {
                        setError("チップ量を選択してください")
                        setIsSubmitting(false)
                        return
                    }
                    const result = await addRingGameChip(existingEntry.id, "BUY_IN", amount, option?.chargeAmount)
                    if (!result.success) {
                        setError(result.errors?._form?.[0] || "エラーが発生しました")
                    } else {
                        handleSuccess()
                    }
                } else {
                    // Cash out
                    const amount = parseInt(cashOutAmount)
                    if (isNaN(amount) || amount <= 0) {
                        setError("金額は1以上の数値を入力してください")
                        setIsSubmitting(false)
                        return
                    }
                    const result = await addRingGameChip(existingEntry.id, "CASH_OUT", amount)
                    if (!result.success) {
                        setError(result.errors?._form?.[0] || "エラーが発生しました")
                    } else {
                        handleSuccess()
                    }
                }
            } else {
                // Registration mode
                const amount = parseInt(chipAmount)
                const option = ringGameBuyInOptions.find(opt => opt.id === selectedBuyInOptionId)
                if (isNaN(amount) || amount < 0) {
                    setError("チップ量を選択してください")
                    setIsSubmitting(false)
                    return
                }
                const result = await addRingGameEntry(visitId, amount, ringGameType, option?.chargeAmount)
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
                        {isJoin ? "リング参加" : "リング管理"}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isJoin ? "リングゲーム参加登録" : "リングゲーム管理"} ({playerName})
                    </DialogTitle>
                    <DialogDescription>
                        {isJoin
                            ? "リングゲームの種別とバイインオプションを選択してください。"
                            : "チップの追加購入(リバイ)またはキャッシュアウトを記録します。"}
                    </DialogDescription>
                </DialogHeader>

                {isJoin ? (
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
                                            <Badge variant="outline">店内リング</Badge>
                                            <span className="text-muted-foreground text-xs">(In-Store)</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="WEB_COIN">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="default">WEBコイン</Badge>
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
                                        {availableBuyInOptions.map((opt) => (
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
