"use client"

import * as React from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Calendar as CalendarIcon, Plus, Users, Clock, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Mock Data
type Tournament = {
    id: number
    name: string
    startTime: string
    entryCount: number
    maxEntry?: number
    status: "upcoming" | "registering" | "running" | "finished" | "canceled"
    buyIn: number
}

const mockTournaments: Tournament[] = [
    { id: 1, name: "デイリーハイパーターボ", startTime: "13:00", entryCount: 5, maxEntry: 20, status: "registering", buyIn: 3000 },
    { id: 2, name: "サタデーディープスタック", startTime: "15:00", entryCount: 12, maxEntry: 50, status: "upcoming", buyIn: 10000 },
    { id: 3, name: "早朝サテライト", startTime: "10:00", entryCount: 8, maxEntry: 10, status: "finished", buyIn: 1000 },
    { id: 4, name: "ミッドナイトマッドネス", startTime: "22:00", entryCount: 0, status: "upcoming", buyIn: 5000 },
]

export default function DailyTournamentsPage() {
    const [date, setDate] = React.useState<Date | undefined>(new Date())

    // In a real app, fetch tournaments for 'date' here
    const displayDate = date ? format(date, "yyyy年MM月dd日 (E)", { locale: ja }) : "日付を選択"

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">トーナメント開催一覧</h1>
                    <p className="text-muted-foreground">
                        {displayDate} の開催スケジュール
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[240px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP", { locale: ja }) : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" /> 新規作成
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockTournaments.map((tournament) => (
                    <Card key={tournament.id} className="flex flex-col">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start gap-2">
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "mb-2",
                                        tournament.status === "registering" && "bg-green-100 text-green-800 border-green-200",
                                        tournament.status === "running" && "bg-blue-100 text-blue-800 border-blue-200",
                                        tournament.status === "finished" && "bg-gray-100 text-gray-800 border-gray-200",
                                        tournament.status === "upcoming" && "bg-yellow-50 text-yellow-800 border-yellow-200"
                                    )}
                                >
                                    {tournament.status === "upcoming" ? "開催前" :
                                        tournament.status === "registering" ? "エントリー受付中" :
                                            tournament.status === "running" ? "進行中" :
                                                tournament.status === "finished" ? "終了" : "中止"}
                                </Badge>
                                <div className="text-sm font-medium text-muted-foreground flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {tournament.startTime}
                                </div>
                            </div>
                            <CardTitle className="leading-tight">{tournament.name}</CardTitle>
                            <CardDescription>
                                Buy-in: {tournament.buyIn.toLocaleString()}円
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">エントリー</span>
                                    <div className="flex items-end gap-1">
                                        <Users className="w-5 h-5 mb-0.5 text-primary" />
                                        <span className="text-xl font-bold">{tournament.entryCount}</span>
                                        {tournament.maxEntry && <span className="text-sm text-muted-foreground">/ {tournament.maxEntry}</span>}
                                    </div>
                                </div>
                                {/* This could be prize pool or specific info */}
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">プライズ</span>
                                    <div className="flex items-end gap-1">
                                        <Trophy className="w-5 h-5 mb-0.5 text-yellow-600" />
                                        <span className="text-sm font-medium pt-1">未確定</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-2 border-t bg-muted/20">
                            <Button variant="ghost" className="w-full justify-between group">
                                詳細・管理
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}

                {/* Empty state card if no tournaments - mocked to show create option */}
                <Card className="flex flex-col items-center justify-center border-dashed h-full min-h-[200px] cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground p-6">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <Plus className="h-6 w-6" />
                        </div>
                        <span className="font-medium">イベントを追加</span>
                    </div>
                </Card>
            </div>
        </div>
    )
}
