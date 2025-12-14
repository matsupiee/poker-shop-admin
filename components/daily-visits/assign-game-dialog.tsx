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
import { Label } from "@/components/ui/label"
import { Coins, Trophy } from "lucide-react"
import { addRingGameEntry, addTournamentEntry } from "@/app/actions/game-participation"

// Types for the partial tournament data we need
type AvailableTournament = {
    id: string
    name: string
    eventDate: Date | string
}

interface AssignGameDialogProps {
    visitId: string
    playerName: string
    tournaments: AvailableTournament[]
    onSuccess?: () => void
}

export function AssignGameDialog({ visitId, playerName, tournaments, onSuccess }: AssignGameDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [mode, setMode] = React.useState<"tournament" | "ring">("tournament")
    const [selectedTournamentId, setSelectedTournamentId] = React.useState<string>("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const handleSubmit = async () => {
        setError(null)
        setIsSubmitting(true)

        try {
            if (mode === "tournament") {
                if (!selectedTournamentId) {
                    setError("トーナメントを選択してください")
                    setIsSubmitting(false)
                    return
                }
                const result = await addTournamentEntry(visitId, selectedTournamentId)
                if (!result.success) {
                    setError(result.errors?._form?.[0] || "エラーが発生しました")
                } else {
                    setOpen(false)
                    if (onSuccess) onSuccess()
                }
            } else {
                const result = await addRingGameEntry(visitId)
                if (!result.success) {
                    setError(result.errors?._form?.[0] || "エラーが発生しました")
                } else {
                    setOpen(false)
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
                <Button variant="outline" size="sm" className="h-8">
                    ゲーム参加
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>ゲーム参加登録 ({playerName})</DialogTitle>
                    <DialogDescription>
                        参加するゲームを選択してください。
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
                                        {tournaments.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 border rounded-md bg-muted/20 text-center">
                            <p className="text-sm text-muted-foreground">
                                リングゲームへの参加（Buy-in待ち状態）を登録します。
                            </p>
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-red-500 font-medium">{error}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isSubmitting || (mode === "tournament" && !selectedTournamentId)}>
                        {isSubmitting ? "処理中..." : "参加する"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
