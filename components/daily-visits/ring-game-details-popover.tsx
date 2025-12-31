"use client"

import * as React from "react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { RingGameChipEventInfo } from "@/app/actions/visits"
import { cn } from "@/lib/utils"

interface RingGameDetailsPopoverProps {
    children: React.ReactNode
    timeline: RingGameChipEventInfo[]
}

export function RingGameDetailsPopover({ children, timeline }: RingGameDetailsPopoverProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-md p-2 -m-2 transition-colors">
                    {children}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                    <h4 className="font-medium leading-none">リングゲーム履歴</h4>
                    {timeline.length === 0 ? (
                        <p className="text-sm text-muted-foreground">履歴はありません</p>
                    ) : (
                        <div className="grid gap-3">
                            {timeline.map((event, i) => (
                                <div key={i} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                                    <span className="text-muted-foreground font-mono text-xs">{event.timestamp}</span>
                                    <span className={cn(
                                        "font-medium text-xs px-2 py-0.5 rounded-full border",
                                        event.eventType === "BUY_IN" ? "bg-primary text-primary-foreground" :
                                            event.eventType === "CASH_OUT" ? "bg-orange-100 text-orange-800 border-orange-200" :
                                                event.eventType === "GIFT" ? "bg-blue-100 text-blue-800 border-blue-200" :
                                                    "bg-muted text-muted-foreground"
                                    )}>
                                        {event.eventType === "BUY_IN" ? "BUY IN" :
                                            event.eventType === "CASH_OUT" ? "CASH OUT" :
                                                event.eventType === "GIFT" ? "GIFT" :
                                                    event.eventType === "WITHDRAW" ? "WITHDRAW" : event.eventType}
                                    </span>
                                    <span className="font-medium font-mono">
                                        {event.chipAmount.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
