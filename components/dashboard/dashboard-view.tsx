"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format, parse } from "date-fns"
import { ja } from "date-fns/locale"
import { Calendar as CalendarIcon, Users, Trophy, DollarSign } from "lucide-react"

import { DailyStat } from "@/app/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DashboardViewProps {
    month: string // YYYY-MM
    stats: DailyStat[]
}

export function DashboardView({ month, stats }: DashboardViewProps) {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)

    // Parse the current month string to a Date object
    const currentDate = React.useMemo(() => {
        return parse(month, "yyyy-MM", new Date())
    }, [month])

    // Calculate Monthly Totals
    const totalVisitors = stats.reduce((acc, curr) => acc + curr.visitors, 0)
    const totalTournaments = stats.reduce((acc, curr) => acc + curr.tournaments, 0)
    const totalTournamentEntries = stats.reduce((acc, curr) => acc + curr.tournamentEntries, 0)
    const totalRingGameEntries = stats.reduce((acc, curr) => acc + curr.ringGameEntries, 0)
    const totalProfit = stats.reduce((acc, curr) => acc + curr.grossProfit, 0)

    const handleMonthSelect = (date: Date | undefined) => {
        if (date) {
            const newMonth = format(date, "yyyy-MM")
            setOpen(false)
            // Use window.location for full page reload to fetch new data
            window.location.href = `/?month=${newMonth}`
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">対象月:</span>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-[200px] justify-start text-left font-normal",
                                    !currentDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {currentDate ? format(currentDate, "yyyy年M月", { locale: ja }) : "月を選択"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={currentDate}
                                onSelect={handleMonthSelect}
                                captionLayout="dropdown"
                                startMonth={new Date(2020, 0)}
                                endMonth={new Date(new Date().getFullYear() + 1, 11)}
                                locale={ja}
                                className="rounded-md border"
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            合計来店人数
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalVisitors.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            合計トーナメント数
                        </CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalTournaments.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            参加者: {totalTournamentEntries.toLocaleString()}名
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            リングゲーム参加
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRingGameEntries.toLocaleString()}名</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            月間粗利
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={cn(
                            "text-2xl font-bold",
                            totalProfit > 0 ? "text-green-600" : totalProfit < 0 ? "text-red-500" : ""
                        )}>
                            ¥{totalProfit.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Daily Table */}
            <Card>
                <CardHeader>
                    <CardTitle>日別データ ({month})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>日付</TableHead>
                                <TableHead className="text-right">来店人数</TableHead>
                                <TableHead className="text-right">トーナメント数</TableHead>
                                <TableHead className="text-right">トナメ参加人数</TableHead>
                                <TableHead className="text-right">リング参加人数</TableHead>
                                <TableHead className="text-right">粗利</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.map((day) => (
                                <TableRow key={day.date}>
                                    <TableCell className="font-medium">
                                        {day.date} <span className="text-muted-foreground text-xs">({day.dayOfWeek})</span>
                                    </TableCell>
                                    <TableCell className="text-right">{day.visitors}</TableCell>
                                    <TableCell className="text-right">{day.tournaments}</TableCell>
                                    <TableCell className="text-right">{day.tournamentEntries}</TableCell>
                                    <TableCell className="text-right">{day.ringGameEntries}</TableCell>
                                    <TableCell className={cn(
                                        "text-right font-mono",
                                        day.grossProfit > 0 ? "text-green-600" : day.grossProfit < 0 ? "text-red-500" : ""
                                    )}>
                                        {day.grossProfit !== 0 ? `¥${day.grossProfit.toLocaleString()}` : "-"}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
