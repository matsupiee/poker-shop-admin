"use client"

import { useActionState, useEffect, useState } from "react"
import { createDealerShift, updateDealerShift } from "@/app/actions/dealer-shifts"
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
import { Plus, Pencil } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RingGameDealerShift, Staff, RingGameDesk } from "@/lib/generated/prisma/client"
import { format } from "date-fns"

const initialState = {
    errors: {},
    success: false
}

interface DealerShiftDialogProps {
    staffList: Pick<Staff, "id" | "name">[]
    deskList: Pick<RingGameDesk, "id" | "name">[]
    initialData?: RingGameDealerShift
    children?: React.ReactNode
    onSuccess?: () => void
}

export function DealerShiftDialog({ staffList, deskList, initialData, children, onSuccess }: DealerShiftDialogProps) {
    const [open, setOpen] = useState(false)

    const handleSuccess = () => {
        setOpen(false)
        if (onSuccess) {
            onSuccess()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children ? children : (
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" /> 記録
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "稼働記録の編集" : "稼働記録の作成"}</DialogTitle>
                    <DialogDescription>
                        ディーラーの稼働結果を入力してください。
                    </DialogDescription>
                </DialogHeader>
                <DealerShiftForm
                    staffList={staffList}
                    deskList={deskList}
                    initialData={initialData}
                    onSuccess={handleSuccess}
                />
            </DialogContent>
        </Dialog>
    )
}

function DealerShiftForm({
    staffList,
    deskList,
    initialData,
    onSuccess
}: {
    staffList: Pick<Staff, "id" | "name">[],
    deskList: Pick<RingGameDesk, "id" | "name">[],
    initialData?: RingGameDealerShift,
    onSuccess: () => void
}) {
    const updateAction = initialData ? updateDealerShift.bind(null, initialData.id) : null
    const [state, action, isPending] = useActionState(
        initialData ? updateAction! : createDealerShift,
        initialState
    )

    const [staffId, setStaffId] = useState(initialData?.staffId || "")
    const [deskId, setDeskId] = useState(initialData?.ringGameDeskId || "")

    // Initial values
    const today = format(new Date(), 'yyyy-MM-dd')
    const initialDate = initialData ? format(new Date(initialData.startedAt), 'yyyy-MM-dd') : today
    const initialStartTime = initialData ? format(new Date(initialData.startedAt), 'HH:mm') : "19:00"
    const initialEndTime = initialData && initialData.endedAt ? format(new Date(initialData.endedAt), 'HH:mm') : ""

    useEffect(() => {
        if (state.success) {
            onSuccess()
        }
    }, [state.success, onSuccess])

    return (
        <form action={action}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="staffId" className="text-right">
                        スタッフ
                    </Label>
                    <div className="col-span-3">
                        <Select value={staffId} onValueChange={setStaffId} name="staffId">
                            <SelectTrigger>
                                <SelectValue placeholder="スタッフを選択" />
                            </SelectTrigger>
                            <SelectContent>
                                {staffList.map((staff) => (
                                    <SelectItem key={staff.id} value={staff.id}>
                                        {staff.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input type="hidden" name="staffId" value={staffId} />
                        {state.errors?.staffId && (
                            <p className="text-red-500 text-xs mt-1">{state.errors.staffId[0]}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">
                        日付
                    </Label>
                    <div className="col-span-3">
                        <Input
                            id="date"
                            name="date"
                            type="date"
                            defaultValue={initialDate}
                        />
                        {state.errors?.startedAt && (
                            <p className="text-red-500 text-xs mt-1">{state.errors.startedAt[0]}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">
                        時間
                    </Label>
                    <div className="col-span-3 flex items-center gap-2">
                        <Input
                            id="startTime"
                            name="startTime"
                            type="time"
                            defaultValue={initialStartTime}
                        />
                        <span>~</span>
                        <Input
                            id="endTime"
                            name="endTime"
                            type="time"
                            defaultValue={initialEndTime}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="ringGameDeskId" className="text-right">
                        テーブル
                    </Label>
                    <div className="col-span-3">
                        <Select value={deskId} onValueChange={setDeskId} name="ringGameDeskId">
                            <SelectTrigger>
                                <SelectValue placeholder="テーブルを選択" />
                            </SelectTrigger>
                            <SelectContent>
                                {deskList.map((desk) => (
                                    <SelectItem key={desk.id} value={desk.id}>
                                        {desk.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input type="hidden" name="ringGameDeskId" value={deskId} />
                        {state.errors?.ringGameDeskId && (
                            <p className="text-red-500 text-xs mt-1">{state.errors.ringGameDeskId[0]}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rakeChip" className="text-right">
                        レーキ
                    </Label>
                    <div className="col-span-3">
                        <Input
                            id="rakeChip"
                            name="rakeChip"
                            type="number"
                            min="0"
                            defaultValue={initialData?.rakeChip ?? 0}
                        />
                        {state.errors?.rakeChip && (
                            <p className="text-red-500 text-xs mt-1">{state.errors.rakeChip[0]}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="jpRakeChip" className="text-right">
                        JPレーキ
                    </Label>
                    <div className="col-span-3">
                        <Input
                            id="jpRakeChip"
                            name="jpRakeChip"
                            type="number"
                            min="0"
                            defaultValue={initialData?.jpRakeChip ?? 0}
                        />
                        {state.errors?.jpRakeChip && (
                            <p className="text-red-500 text-xs mt-1">{state.errors.jpRakeChip[0]}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dealerChip" className="text-right">
                        ディーラー
                    </Label>
                    <div className="col-span-3">
                        <Input
                            id="dealerChip"
                            name="dealerChip"
                            type="number"
                            min="0"
                            defaultValue={initialData?.dealerChip ?? 0}
                        />
                        {state.errors?.dealerChip && (
                            <p className="text-red-500 text-xs mt-1">{state.errors.dealerChip[0]}</p>
                        )}
                    </div>
                </div>

                {state.errors?._form && (
                    <div className="text-red-500 text-sm text-center">
                        {state.errors._form[0]}
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isPending}>
                    {isPending ? "保存中..." : "保存"}
                </Button>
            </DialogFooter>
        </form>
    )
}
