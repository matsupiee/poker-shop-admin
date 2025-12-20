"use client"

import { RingGameDealerShift, Staff, RingGameDesk } from "@/lib/generated/prisma/client"
import { DealerShiftDialog } from "./dealer-shift-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { deleteDealerShift } from "@/app/actions/dealer-shifts"
import { format } from "date-fns"
import { useTransition } from "react"

type DealerShiftWithDetails = RingGameDealerShift & {
    staff: Staff
    ringGameDesk: RingGameDesk
}

interface DealerShiftListProps {
    shifts: DealerShiftWithDetails[]
    staffList: Pick<Staff, "id" | "name">[]
    deskList: Pick<RingGameDesk, "id" | "name">[]
}

export function DealerShiftList({ shifts, staffList, deskList }: DealerShiftListProps) {
    const [isPending, startTransition] = useTransition()

    const handleDelete = (id: string) => {
        if (confirm("本当に削除しますか？")) {
            startTransition(async () => {
                await deleteDealerShift(id)
            })
        }
    }

    // Sort shifts by date (newest first)
    const sortedShifts = [...shifts].sort((a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    )

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>日付</TableHead>
                        <TableHead>時間</TableHead>
                        <TableHead>スタッフ</TableHead>
                        <TableHead>テーブル</TableHead>
                        <TableHead className="text-right">レーキ</TableHead>
                        <TableHead className="text-right">JPレーキ</TableHead>
                        <TableHead className="text-right">ディーラー</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedShifts.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground h-24">
                                データがありません
                            </TableCell>
                        </TableRow>
                    ) : (
                        sortedShifts.map((shift) => (
                            <TableRow key={shift.id}>
                                <TableCell>
                                    {format(new Date(shift.startedAt), 'yyyy/MM/dd')}
                                </TableCell>
                                <TableCell>
                                    {format(new Date(shift.startedAt), 'HH:mm')} -
                                    {shift.endedAt ? format(new Date(shift.endedAt), 'HH:mm') : ''}
                                </TableCell>
                                <TableCell>{shift.staff.name}</TableCell>
                                <TableCell>{shift.ringGameDesk.name}</TableCell>
                                <TableCell className="text-right">{shift.rakeChip.toLocaleString()}</TableCell>
                                <TableCell className="text-right">{shift.jpRakeChip.toLocaleString()}</TableCell>
                                <TableCell className="text-right">{shift.dealerChip.toLocaleString()}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <DealerShiftDialog
                                            staffList={staffList}
                                            deskList={deskList}
                                            initialData={shift}
                                        >
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </DealerShiftDialog>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(shift.id)}
                                            disabled={isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
