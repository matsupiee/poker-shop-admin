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
import { updateTournamentRank } from "@/app/actions/visits"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

type Props = {
    entryId: string
    currentRank?: number
    status: "playing" | "eliminated" | "finished"
    onSuccess?: () => void
}

export function TournamentRankUpdate({ entryId, currentRank, status, onSuccess }: Props) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [rank, setRank] = React.useState(currentRank?.toString() ?? "")
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const handleUpdate = async () => {
        const rankNum = parseInt(rank)
        if (isNaN(rankNum) || rankNum < 1) {
            toast.error("有効な順位を入力してください")
            return
        }

        setIsSubmitting(true)
        try {
            const result = await updateTournamentRank(entryId, rankNum)
            if (result.success) {
                toast.success("順位を更新しました")
                setIsOpen(false)
                onSuccess?.()
            } else {
                toast.error(result.error || "順位の更新に失敗しました")
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
                <Badge
                    variant={status === "playing" ? "default" : "secondary"}
                    className="text-[10px] px-1 py-0 h-5 cursor-pointer hover:opacity-80 transition-opacity"
                >
                    {status === "playing" ? "プレイ中" : `${currentRank}位`}
                </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3">
                <div className="space-y-2">
                    <h4 className="font-medium leading-none text-xs">順位を記録</h4>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            value={rank}
                            onChange={(e) => setRank(e.target.value)}
                            placeholder="順位"
                            className="h-8 text-sm"
                            min="1"
                        />
                        <Button
                            size="sm"
                            className="h-8 px-2"
                            onClick={handleUpdate}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                "保存"
                            )}
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
