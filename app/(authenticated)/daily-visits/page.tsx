"use client"

import * as React from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Calendar as CalendarIcon, Search, Filter, Trophy, Coins, Clock, Plus, Settings2 } from "lucide-react"
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
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getDailyVisits, type DailyVisit } from "@/app/actions/visits"
import { getTournaments } from "@/app/actions/tournaments"
import { TournamentParticipationDialog } from "@/components/daily-visits/tournament-participation-dialog"
import { RingGameDialog } from "@/components/daily-visits/ring-game-dialog"
import { TournamentRankUpdate } from "@/components/daily-visits/tournament-rank-update"
import { SettlementDialog } from "@/components/daily-visits/settlement-dialog"
import { RingGameDetailsPopover } from "@/components/daily-visits/ring-game-details-popover"
import { AddOnDialog } from "@/components/tournaments/add-on-dialog"
import { getRingGameBuyInOptions } from "@/app/actions/ring-game-buy-in-options"

export default function DailyVisitsPage() {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [searchTerm, setSearchTerm] = React.useState("")
    const [visits, setVisits] = React.useState<DailyVisit[]>([])
    const [tournaments, setTournaments] = React.useState<Awaited<ReturnType<typeof getTournaments>>>([])
    const [ringGameBuyInOptions, setRingGameBuyInOptions] = React.useState<Awaited<ReturnType<typeof getRingGameBuyInOptions>>>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>([])

    const fetchData = React.useCallback(async () => {
        if (!date) return
        setIsLoading(true)
        try {
            const [visitsData, tournamentsData, ringGameBuyInOptionsData] = await Promise.all([
                getDailyVisits(date),
                getTournaments(date),
                getRingGameBuyInOptions()
            ])
            setVisits(visitsData)
            setTournaments(tournamentsData)
            setRingGameBuyInOptions(ringGameBuyInOptionsData)
        } catch (error) {
            console.error("Failed to fetch data", error)
        } finally {
            setIsLoading(false)
        }
    }, [date])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleFilterChange = (filterId: string) => {
        setSelectedFilters(prev =>
            prev.includes(filterId)
                ? prev.filter(id => id !== filterId)
                : [...prev, filterId]
        )
    }

    // フィルタリング処理 (名前検索 + 詳細フィルター)
    const filteredVisits = visits.filter(visit => {
        // 1. Search Term Filter
        const matchesSearch = visit.player.name.includes(searchTerm) ||
            visit.player.memberId.includes(searchTerm)

        if (!matchesSearch) return false

        // 2. Detailed Filter (OR Logic)
        if (selectedFilters.length === 0) return true

        const matchesRingGame = selectedFilters.includes("ring_game") && visit.ringGameEntries.length > 0

        // Check if any of the user's tournaments match the selected filters
        const matchesTournament = visit.tournaments.some(t => selectedFilters.includes(t.tournamentId))

        // If "ring_game" is selected, it matches ring game players.
        // If tournament IDs are selected, it matches players of those tournaments.
        // If "ring_game" AND tournament APIs are selected, it matches EITHER.
        return matchesRingGame || matchesTournament
    })

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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className={selectedFilters.length > 0 ? "bg-accent" : ""}>
                                    <Filter className="mr-2 h-4 w-4" />
                                    詳細フィルター
                                    {selectedFilters.length > 0 && (
                                        <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                                            {selectedFilters.length}
                                        </Badge>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[280px]">
                                <DropdownMenuLabel>表示フィルター</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem
                                    checked={selectedFilters.includes("ring_game")}
                                    onCheckedChange={() => handleFilterChange("ring_game")}
                                >
                                    <div className="flex items-center">
                                        <Coins className="mr-2 h-4 w-4 text-muted-foreground" />
                                        リングゲーム参加
                                    </div>
                                </DropdownMenuCheckboxItem>
                                {tournaments.length > 0 && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel>トーナメント参加</DropdownMenuLabel>
                                        {tournaments.map((tournament) => (
                                            <DropdownMenuCheckboxItem
                                                key={tournament.id}
                                                checked={selectedFilters.includes(tournament.id)}
                                                onCheckedChange={() => handleFilterChange(tournament.id)}
                                            >
                                                <div className="flex flex-col">
                                                    <span>{tournament.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        ({format(new Date(tournament.startAt), "HH:mm")} ~)
                                                    </span>
                                                </div>
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">会員ID</TableHead>
                                    <TableHead className="min-w-[140px]">プレイヤー</TableHead>
                                    <TableHead className="w-[100px]">来店時刻</TableHead>
                                    <TableHead className="min-w-[400px]">ゲーム参加状況 (トナメ / リング)</TableHead>
                                    <TableHead className="text-right w-[120px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            読み込み中...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredVisits.length === 0 ? (
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
                                            <TableCell className="p-0 border-l border-r">
                                                <div className="flex flex-col">
                                                    {/* Tournaments of the day */}
                                                    {tournaments.map((t, idx) => (
                                                        <div key={t.id} className={cn("flex items-stretch border-b last:border-0", idx === 0 && "border-t-0")}>
                                                            <div className="w-24 flex-shrink-0 bg-muted/30 px-2 py-2 border-r flex items-center justify-center text-[10px] font-bold text-center leading-tight">
                                                                {t.name}
                                                            </div>
                                                            <div className="flex-1 flex gap-1 p-1 overflow-x-auto min-h-[64px] items-center">
                                                                {visit.tournaments.filter(e => e.tournamentId === t.id).map(e => (
                                                                    <TournamentRankUpdate
                                                                        key={e.eventId}
                                                                        entryId={e.entryId}
                                                                        currentRank={e.rank}
                                                                        status={e.status}
                                                                        onSuccess={fetchData}
                                                                        trigger={
                                                                            <div className={cn(
                                                                                "border rounded px-2 py-1 text-[10px] min-w-[70px] bg-background shadow-sm hover:border-accent transition-colors cursor-pointer",
                                                                                e.isLatestEntry && "border-primary/50 bg-primary/5",
                                                                                e.eventType === "ADD_CHIP" && "bg-yellow-50/50"
                                                                            )}>
                                                                                <div className="flex justify-between items-start">
                                                                                    <span className="text-muted-foreground font-mono">{e.timestamp}</span>
                                                                                    <Badge variant="outline" className="text-[8px] h-3 px-1 leading-none">
                                                                                        {e.eventType === "ENTRY" ? "E" : "A"}
                                                                                    </Badge>
                                                                                </div>
                                                                                <div className="font-bold">
                                                                                    {e.eventType === "ENTRY" ? (e.rank ? `${e.rank}位` : (e.status === 'playing' ? 'Playing' : 'Elim')) : `+${e.chipAmount.toLocaleString()}`}
                                                                                </div>
                                                                                <div className="text-muted-foreground">¥{e.chargeAmount.toLocaleString()}</div>
                                                                            </div>
                                                                        }
                                                                    />
                                                                ))}
                                                                <TournamentParticipationDialog
                                                                    visitId={visit.id}
                                                                    playerName={visit.player.name}
                                                                    tournaments={tournaments}
                                                                    onSuccess={fetchData}
                                                                    defaultTournamentId={t.id}
                                                                    trigger={
                                                                        <Button variant="ghost" size="icon" className="h-10 w-10 border-2 border-dashed rounded-md text-muted-foreground hover:text-foreground">
                                                                            <Plus className="h-4 w-4" />
                                                                        </Button>
                                                                    }
                                                                />
                                                                {/* Add-on button for the latest entry */}
                                                                {visit.tournaments.find(e => e.tournamentId === t.id && e.isLatestEntry) && (
                                                                    <div className="ml-2">
                                                                        <AddOnDialog
                                                                            tournamentEntryId={visit.tournaments.find(e => e.tournamentId === t.id && e.isLatestEntry)!.entryId}
                                                                            playerName={visit.player.name}
                                                                            chipEventOptions={tournaments.find(tourney => tourney.id === t.id)?.tournamentChipEventOptions ?? []}
                                                                            onSuccess={fetchData}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Web Ring */}
                                                    <div className="flex items-stretch border-b last:border-0">
                                                        <div className="w-24 flex-shrink-0 bg-muted px-2 py-2 border-r flex items-center justify-center text-[10px] font-bold text-foreground text-center leading-tight">
                                                            WEBコイン
                                                        </div>
                                                        <div className="flex-1 flex gap-1 p-1 overflow-x-auto min-h-[64px] items-center">
                                                            {visit.ringGameEntries.filter(e => e.ringGameType === "WEB_COIN").map(entry => (
                                                                entry.timeline.filter(ev => ev.eventType === "BUY_IN").map((ev, i) => (
                                                                    <div key={i} className="border rounded px-2 py-1 text-[10px] min-w-[70px] bg-background shadow-sm">
                                                                        <div className="text-muted-foreground font-mono">{ev.timestamp}</div>
                                                                        <div className="font-bold">{ev.chipAmount.toLocaleString()}</div>
                                                                        <div className="text-muted-foreground">¥{(ev.chargeAmount ?? 0).toLocaleString()}</div>
                                                                    </div>
                                                                ))
                                                            ))}
                                                            {(() => {
                                                                const entry = visit.ringGameEntries.find(e => e.ringGameType === "WEB_COIN");
                                                                return (
                                                                    <RingGameDialog
                                                                        visitId={visit.id}
                                                                        playerName={visit.player.name}
                                                                        ringGameBuyInOptions={ringGameBuyInOptions}
                                                                        onSuccess={fetchData}
                                                                        ringGameType="WEB_COIN"
                                                                        existingEntry={entry ? {
                                                                            id: entry.id,
                                                                            totalBuyIn: entry.totalBuyIn,
                                                                            totalCashOut: entry.totalCashOut,
                                                                        } : undefined}
                                                                        trigger={
                                                                            <Button variant="ghost" size="icon" className="h-10 w-10 border-2 border-dashed rounded-md text-muted-foreground hover:text-foreground">
                                                                                <Plus className="h-4 w-4" />
                                                                            </Button>
                                                                        }
                                                                    />
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>

                                                    {/* Store Ring */}
                                                    <div className="flex items-stretch">
                                                        <div className="w-24 flex-shrink-0 bg-muted px-2 py-2 border-r flex items-center justify-center text-[10px] font-bold text-foreground text-center leading-tight">
                                                            店内リング
                                                        </div>
                                                        <div className="flex-1 flex gap-1 p-1 overflow-x-auto min-h-[64px] items-center">
                                                            {visit.ringGameEntries.filter(e => e.ringGameType === "IN_STORE").map(entry => (
                                                                entry.timeline.filter(ev => ev.eventType === "BUY_IN").map((ev, i) => (
                                                                    <div key={i} className="border rounded px-2 py-1 text-[10px] min-w-[70px] bg-background shadow-sm">
                                                                        <div className="text-muted-foreground font-mono">{ev.timestamp}</div>
                                                                        <div className="font-bold text-orange-600">{ev.chipAmount.toLocaleString()}</div>
                                                                        <div className="text-muted-foreground">¥{(ev.chargeAmount ?? 0).toLocaleString()}</div>
                                                                    </div>
                                                                ))
                                                            ))}
                                                            {(() => {
                                                                const entry = visit.ringGameEntries.find(e => e.ringGameType === "IN_STORE");
                                                                return (
                                                                    <RingGameDialog
                                                                        visitId={visit.id}
                                                                        playerName={visit.player.name}
                                                                        ringGameBuyInOptions={ringGameBuyInOptions}
                                                                        onSuccess={fetchData}
                                                                        ringGameType="IN_STORE"
                                                                        existingEntry={entry ? {
                                                                            id: entry.id,
                                                                            totalBuyIn: entry.totalBuyIn,
                                                                            totalCashOut: entry.totalCashOut,
                                                                        } : undefined}
                                                                        trigger={
                                                                            <Button variant="ghost" size="icon" className="h-10 w-10 border-2 border-dashed rounded-md text-muted-foreground hover:text-foreground">
                                                                                <Plus className="h-4 w-4" />
                                                                            </Button>
                                                                        }
                                                                    />
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <SettlementDialog
                                                    visitId={visit.id}
                                                    playerName={visit.player.name}
                                                    isSettled={!!visit.settlement}
                                                    onSuccess={fetchData}
                                                />
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
