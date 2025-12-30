"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateTournamentResult } from "@/app/actions/visits"
import { Loader2, Trophy, Target } from "lucide-react"
import { toast } from "sonner"

type Props = {
    entryId: string
    currentRank?: number
    currentBounty?: number
    status: "playing" | "eliminated" | "finished"
    onSuccess?: () => void
    trigger?: React.ReactNode
}

export function TournamentResultUpdate({ entryId, currentRank, currentBounty, status, onSuccess, trigger }: Props) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [rank, setRank] = React.useState(currentRank?.toString() ?? "")
    const [bounty, setBounty] = React.useState(currentBounty?.toString() ?? "")
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const handleUpdate = async () => {
        const rankNum = rank ? parseInt(rank) : undefined
        const bountyNum = bounty ? parseInt(bounty) : undefined

        if (rankNum !== undefined && (isNaN(rankNum) || rankNum < 1)) {
            toast.error("有効な順位を入力してください")
            return
        }

        if (bountyNum !== undefined && (isNaN(bountyNum) || bountyNum < 0)) {
            toast.error("有効なバウンティ数を入力してください")
            return
        }

        setIsSubmitting(true)
        try {
            const result = await updateTournamentResult(entryId, rankNum, bountyNum)
            if (result.success) {
                toast.success("結果を更新しました")
                setIsOpen(false)
                onSuccess?.()
            } else {
                toast.error(result.error || "結果の更新に失敗しました")
            }
        } catch (error) {
            toast.error("エラーが発生しました")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="h-8 px-2">
                        結果
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4">
                <div className="space-y-4">
                    <h4 className="font-medium leading-none">結果を記録</h4>
                    <div className="grid gap-3">
                        <div className="grid gap-1.5">
                            <label className="text-xs font-medium flex items-center gap-1">
                                <Trophy className="w-3 h-3 text-yellow-500" />
                                順位
                            </label>
                            <Input
                                type="number"
                                value={rank}
                                onChange={(e) => setRank(e.target.value)}
                                placeholder="順位 (1, 2, ...)"
                                className="h-8 text-sm"
                                min="1"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <label className="text-xs font-medium flex items-center gap-1">
                                <Target className="w-3 h-3 text-red-500" />
                                バウンティ
                            </label>
                            <Input
                                type="number"
                                value={bounty}
                                onChange={(e) => setBounty(e.target.value)}
                                placeholder="飛ばした人数"
                                className="h-8 text-sm"
                                min="0"
                            />
                        </div>
                        <Button
                            size="sm"
                            className="w-full h-8 mt-1"
                            onClick={handleUpdate}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-2" />
                            ) : null}
                            保存
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
