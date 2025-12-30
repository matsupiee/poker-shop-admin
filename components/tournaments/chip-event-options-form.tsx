"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"

export type ChipEventOption = {
    eventType: "ENTRY" | "ADD_CHIP"
    name: string
    chipAmount: number
    chargeAmount: number
}

interface ChipEventOptionsFormProps {
    options: ChipEventOption[]
    onChange: (options: ChipEventOption[]) => void
}

export function ChipEventOptionsForm({ options, onChange }: ChipEventOptionsFormProps) {
    const addOption = () => {
        onChange([
            ...options,
            { eventType: "ENTRY", name: "", chipAmount: 0, chargeAmount: 0 }
        ])
    }

    const removeOption = (index: number) => {
        onChange(options.filter((_, i) => i !== index))
    }

    const updateOption = (index: number, key: keyof ChipEventOption, value: any) => {
        const newOptions = [...options]
        newOptions[index] = { ...newOptions[index], [key]: value }
        onChange(newOptions)
    }

    return (
        <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-8">
                <Label>バイイン・アドオン設定</Label>
            </div>
            <div className="space-y-4 pr-2">
                {options.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-2">
                        バイイン・アドオン設定なし
                    </div>
                )}
                {options.map((option, index) => (
                    <div key={index} className="grid grid-cols-[120px_160px_160px_160px_24px] gap-2 items-start text-sm border p-2 rounded-md">
                        <div className="grid gap-1">
                            <Label className="text-xs text-muted-foreground">種別</Label>
                            <Select
                                value={option.eventType}
                                onValueChange={(v) => updateOption(index, "eventType", v)}
                            >
                                <SelectTrigger className="h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ENTRY">エントリー</SelectItem>
                                    <SelectItem value="ADD_CHIP">アドオン</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-xs text-muted-foreground">名称</Label>
                            <Input
                                value={option.name}
                                onChange={(e) => updateOption(index, "name", e.target.value)}
                                className="h-8"
                                placeholder="例: エントリー..."
                            />
                        </div>
                        <div className="grid gap-1 relative">
                            <Label className="text-xs text-muted-foreground">チップ量</Label>
                            <Input
                                type="number"
                                value={option.chipAmount === 0 ? '' : option.chipAmount}
                                onChange={(e) => updateOption(index, "chipAmount", Number(e.target.value))}
                                className="h-8"
                                placeholder="0"
                            />
                        </div>
                        <div className="grid gap-1 relative">
                            <Label className="text-xs text-muted-foreground">金額(円)</Label>
                            <Input
                                type="number"
                                value={option.chargeAmount === 0 ? '' : option.chargeAmount}
                                onChange={(e) => updateOption(index, "chargeAmount", Number(e.target.value))}
                                className="h-8 pl-6"
                                placeholder="0"
                            />
                            <span className="absolute left-2 top-[26px] text-muted-foreground text-xs">¥</span>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(index)}
                            className="text-muted-foreground hover:text-destructive h-8 w-8 mt-5"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                    onClick={addOption}
                >
                    <Plus className="h-4 w-4 mr-1" /> 追加
                </Button>
            </div>
            <input
                type="hidden"
                name="chipEventOptions"
                value={JSON.stringify(options.filter(o => o.chipAmount > 0 || o.chargeAmount > 0))}
            />
        </div>
    )
}
