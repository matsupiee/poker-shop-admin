"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Staff } from "@/lib/generated/prisma/client"
import { UserPlus, UserMinus, Armchair } from "lucide-react"
import { useState, useTransition } from "react"
import { sitDownAtTable, standUpFromTable } from "@/app/actions/ring-game-tables"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"

interface TableCardProps {
    desk: {
        id: string
        name: string
        activeShift?: {
            id: string
            staff: { name: string }
            startedAt: Date
        } | null
    }
    staffList: Pick<Staff, "id" | "name">[]
}

export function TableCard({ desk, staffList }: TableCardProps) {
    const [isSeatDialogOpen, setIsSeatDialogOpen] = useState(false)
    const [selectedStaffId, setSelectedStaffId] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const handleSitDown = async () => {
        if (!selectedStaffId) return
        setError(null)

        const formData = new FormData()
        formData.append("deskId", desk.id)
        formData.append("staffId", selectedStaffId)

        startTransition(async () => {
            const result = await sitDownAtTable(formData)
            if (result.success) {
                setIsSeatDialogOpen(false)
                setSelectedStaffId("")
                setError(null)
            } else if (result.error) {
                setError(result.error)
            }
        })
    }

    const handleStandUp = async () => {
        if (!confirm("退席しますか？")) return

        startTransition(async () => {
            await standUpFromTable(desk.id)
        })
    }

    const isActive = !!desk.activeShift

    return (
        <Card className={`relative overflow-hidden transition-all hover:shadow-md ${isActive ? "border-primary/50 bg-primary/5" : "border-dashed"}`}>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                    <span className="text-lg font-bold">{desk.name}</span>
                    <Armchair className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground/30"}`} />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    {isActive ? (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Current Dealer</p>
                                <p className="text-2xl font-bold tracking-tight text-primary">
                                    {desk.activeShift?.staff.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Started {formatDistanceToNow(new Date(desk.activeShift!.startedAt), { addSuffix: true, locale: ja })}
                                </p>
                            </div>

                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={handleStandUp}
                                disabled={isPending}
                            >
                                <UserMinus className="mr-2 h-4 w-4" />
                                退席 (Stand Up)
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4 py-2">
                            <div className="flex items-center justify-center p-4 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                                <span className="text-sm">Empty Table</span>
                            </div>

                            <Dialog open={isSeatDialogOpen} onOpenChange={(open) => {
                                setIsSeatDialogOpen(open)
                                if (open) {
                                    setError(null)
                                    setSelectedStaffId("")
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <Button className="w-full" variant="outline">
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        着席 (Sit Down)
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>ディーラー着席</DialogTitle>
                                        <DialogDescription>
                                            {desk.name} に着席するスタッフを選択してください
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4 space-y-4">
                                        <Select value={selectedStaffId} onValueChange={(val) => { setSelectedStaffId(val); setError(null); }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="スタッフを選択" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {staffList.map(staff => (
                                                    <SelectItem key={staff.id} value={staff.id}>
                                                        {staff.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {error && (
                                            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                                                {error}
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={handleSitDown}
                                            disabled={!selectedStaffId || isPending}
                                        >
                                            {isPending ? "処理中..." : "着席する"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
