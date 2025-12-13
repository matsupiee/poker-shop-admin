"use client"

import * as React from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Calendar as CalendarIcon, Search, Filter, Trophy, Coins, Clock, ArrowUpDown } from "lucide-react"
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
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Mock Data Types reflecting the Prisma schema relationships
type TournamentEntryInfo = {
    id: number
    tournamentName: string
    tournamentId: number
    status: "playing" | "eliminated" | "finished"
    rank?: number
    entryCount: number // Total entries (1 = single entry, 2 = 1 re-entry)
}

type RingGameInfo = {
    joined: boolean
    currentStatus: "playing" | "left"
    totalBuyIn: number
    totalCashOut?: number
}

type DailyVisit = {
    id: number
    visitDate: string // ISO date string
    checkInTime: string // Time string HH:mm
    player: {
        id: number
        memberId: string
        name: string
        image?: string
    }
    tournaments: TournamentEntryInfo[]
    ringGame: RingGameInfo
}

// Mock Data
const mockVisits: DailyVisit[] = [
    {
        id: 1,
        visitDate: "2023-12-13",
        checkInTime: "13:15",
        player: { id: 1, memberId: "M001", name: "田中 太郎" },
        tournaments: [
            { id: 101, tournamentName: "デイリーハイパーターボ", tournamentId: 1, status: "eliminated", rank: 12, entryCount: 1 },
            { id: 102, tournamentName: "ミッドナイトマッドネス", tournamentId: 4, status: "playing", entryCount: 2 }
        ],
        ringGame: { joined: false, currentStatus: "left", totalBuyIn: 0 }
    },
    {
        id: 2,
        visitDate: "2023-12-13",
        checkInTime: "14:30",
        player: { id: 2, memberId: "M002", name: "佐藤 花子" },
        tournaments: [],
        ringGame: { joined: true, currentStatus: "playing", totalBuyIn: 50000 }
    },
    {
        id: 3,
        visitDate: "2023-12-13",
        checkInTime: "15:00",
        player: { id: 4, memberId: "M004", name: "高橋 次郎" },
        tournaments: [
            { id: 103, tournamentName: "サタデーディープスタック", tournamentId: 2, status: "playing", entryCount: 1 }
        ],
        ringGame: { joined: true, currentStatus: "left", totalBuyIn: 30000, totalCashOut: 45000 }
    },
    {
        id: 4,
        visitDate: "2023-12-13",
        checkInTime: "18:45",
        player: { id: 5, memberId: "M005", name: "鈴木 一郎" },
        tournaments: [],
        ringGame: { joined: true, currentStatus: "left", totalBuyIn: 20000, totalCashOut: 0 }
    }
]

export default function DailyVisitsPage() {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [searchTerm, setSearchTerm] = React.useState("")

    // フィルタリング処理 (名前検索)
    const filteredVisits = mockVisits.filter(visit =>
        visit.player.name.includes(searchTerm) ||
        visit.player.memberId.includes(searchTerm)
    )

    const displayDate = date ? format(date, "yyyy年MM月dd日 (E)", { locale: ja }) : "日付を選択"

    return (
        <div className="container mx-auto py-10 space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">来店プレイヤー情報</h1>
                    <p className="text-muted-foreground">
                        {displayDate} の来店者とプレイ状況を確認・管理します。
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
                </div>
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>来店リスト ({filteredVisits.length}名)</span>
                    </CardTitle>
                    <CardDescription>
                        プレイヤーごとのトーナメント参加状況とリングゲーム収支一覧
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex items-center justify-between mb-4 gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="名前または会員IDで検索..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="sm">
                            <Filter className="mr-2 h-4 w-4" /> 詳細フィルター
                        </Button>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">会員ID</TableHead>
                                    <TableHead className="min-w-[140px]">プレイヤー</TableHead>
                                    <TableHead className="w-[100px]">来店時刻</TableHead>
                                    <TableHead className="min-w-[250px]">参加トーナメント</TableHead>
                                    <TableHead className="min-w-[200px]">リングゲーム</TableHead>
                                    <TableHead className="text-right">ステータス</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredVisits.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            該当するデータが見つかりません。
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredVisits.map((visit) => (
                                        <TableRow key={visit.id}>
                                            <TableCell className="font-medium text-muted-foreground">
                                                {visit.player.memberId}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${visit.player.name}`} />
                                                        <AvatarFallback>{visit.player.name.slice(0, 2)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{visit.player.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-muted-foreground">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {visit.checkInTime}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-2">
                                                    {visit.tournaments.length > 0 ? (
                                                        visit.tournaments.map(t => (
                                                            <div key={t.id} className="flex items-center text-sm gap-2">
                                                                <Trophy className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0" />
                                                                <span className="truncate max-w-[150px]" title={t.tournamentName}>
                                                                    {t.tournamentName}
                                                                </span>
                                                                <Badge
                                                                    variant={t.status === "playing" ? "default" : "secondary"}
                                                                    className="text-[10px] px-1 py-0 h-5"
                                                                >
                                                                    {t.status === "playing" ? "プレイ中" : `${t.rank}位`}
                                                                </Badge>
                                                                {t.entryCount > 1 && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        ({t.entryCount}E)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {visit.ringGame.joined ? (
                                                    <div className="flex flex-col gap-1 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Coins className="w-3.5 h-3.5 text-orange-500" />
                                                            <span className="font-medium">
                                                                In: {visit.ringGame.totalBuyIn.toLocaleString()}
                                                            </span>
                                                        </div>
                                                        {visit.ringGame.currentStatus === "left" && visit.ringGame.totalCashOut !== undefined ? (
                                                            <div className={cn(
                                                                "flex items-center gap-2",
                                                                (visit.ringGame.totalCashOut - visit.ringGame.totalBuyIn) >= 0
                                                                    ? "text-green-600"
                                                                    : "text-red-500"
                                                            )}>
                                                                <span className="font-bold">
                                                                    {(visit.ringGame.totalCashOut - visit.ringGame.totalBuyIn) > 0 ? "+" : ""}
                                                                    {(visit.ringGame.totalCashOut - visit.ringGame.totalBuyIn).toLocaleString()}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">(Out: {visit.ringGame.totalCashOut.toLocaleString()})</span>
                                                            </div>
                                                        ) : (
                                                            <Badge variant="outline" className="w-fit text-xs border-green-200 bg-green-50 text-green-700">
                                                                プレイ中
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">
                                                    詳細
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
