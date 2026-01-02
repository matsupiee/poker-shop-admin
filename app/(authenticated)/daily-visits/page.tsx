"use client"

import * as React from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Calendar as CalendarIcon, Search, Filter, Trophy, Coins, Clock, Plus, Settings2, Target } from "lucide-react"
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
import Link from "next/link"
import { getDailyVisits, type DailyVisit } from "@/app/actions/visits"
import { getTournaments } from "@/app/actions/tournaments"
import { getRingGameBuyInOptions } from "@/app/actions/ring-game-buy-in-options"
import { TournamentDialog } from "@/components/daily-visits/tournament-dialog"
import { TournamentResultUpdate } from "@/components/daily-visits/tournament-result-update"
import { SettlementDialog } from "@/components/daily-visits/settlement-dialog"
import { WebCoinRingGameDialog } from "@/components/daily-visits/web-coin-ring-game-dialog"
import { InStoreRingGameDialog } from "@/components/daily-visits/in-store-ring-game-dialog"
import { RingGameDetailsPopover } from "@/components/daily-visits/ring-game-details-popover"

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
                                    <TableHead className="min-w-[400px] max-w-[600px]">ゲーム参加状況 (トナメ / リング)</TableHead>
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
                                                <Link href={`/players/${visit.player.id}`} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${visit.player.name}`} />
                                                        <AvatarFallback>{visit.player.name.slice(0, 2)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{visit.player.name}</span>
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-muted-foreground">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {visit.checkInTime}
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-0 border-l border-r max-w-[600px]">
                                                <div className="flex flex-col">
                                                    {/* Tournaments of the day */}
                                                    {tournaments.map((t, idx) => (
                                                        <div key={t.id} className={cn("flex items-stretch border-b last:border-0", idx === 0 && "border-t-0")}>
                                                            <div className="w-24 flex-shrink-0 bg-muted/30 px-2 py-2 border-r flex items-center justify-center text-[10px] font-bold text-center leading-tight">
                                                                <Link
                                                                    href={`/tournaments/${t.id}`}
                                                                    className="hover:text-primary transition-colors"
                                                                >
                                                                    {t.name}
                                                                </Link>
                                                            </div>
                                                            <div className="flex-1 overflow-hidden relative flex items-stretch">
                                                                {(() => {
                                                                    const tournamentEvents = visit.tournaments.filter(e => e.tournamentId === t.id);
                                                                    const latestEntry = tournamentEvents.find(e => e.isLatestEntry);

                                                                    return (
                                                                        <>
                                                                            <div className="flex-1 flex gap-1 p-1 overflow-x-auto min-h-[64px] items-center scrollbar-hide">
                                                                                {tournamentEvents.map(e => (
                                                                                    <TournamentResultUpdate
                                                                                        key={e.eventId}
                                                                                        entryId={e.entryId}
                                                                                        currentRank={e.rank}
                                                                                        currentBounty={e.bountyCount}
                                                                                        status={e.status}
                                                                                        onSuccess={fetchData}
                                                                                        hasBounty={e.hasBounty}
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
                                                                                <TournamentDialog
                                                                                    visitId={visit.id}
                                                                                    playerName={visit.player.name}
                                                                                    tournaments={tournaments}
                                                                                    onSuccess={fetchData}
                                                                                    defaultTournamentId={t.id}
                                                                                    existingEntryId={latestEntry?.entryId}
                                                                                    trigger={
                                                                                        <Button variant="ghost" size="icon" className="flex-shrink-0 h-10 w-10 border-2 border-dashed rounded-md text-muted-foreground hover:text-foreground">
                                                                                            <Plus className="h-4 w-4" />
                                                                                        </Button>
                                                                                    }
                                                                                />
                                                                            </div>

                                                                            {latestEntry && (
                                                                                <div className="w-28 flex-shrink-0 flex items-center justify-end gap-2 px-2 border-l bg-background/50 backdrop-blur-sm">
                                                                                    {(latestEntry.rank || (latestEntry.bountyCount !== undefined && latestEntry.bountyCount > 0)) && (
                                                                                        <div className="flex flex-col items-end gap-1">
                                                                                            {latestEntry.rank && (
                                                                                                <Badge variant="secondary" className="h-5 text-[10px] bg-yellow-100/80 text-yellow-800 border-yellow-200 whitespace-nowrap">
                                                                                                    <Trophy className="w-2.5 h-2.5 mr-1" />
                                                                                                    {latestEntry.rank}位
                                                                                                </Badge>
                                                                                            )}
                                                                                            {latestEntry.hasBounty && latestEntry.bountyCount !== undefined && latestEntry.bountyCount > 0 && (
                                                                                                <Badge variant="secondary" className="h-5 text-[10px] bg-rose-100/80 text-rose-800 border-rose-200 whitespace-nowrap">
                                                                                                    <Target className="w-2.5 h-2.5 mr-1" />
                                                                                                    {latestEntry.bountyCount}
                                                                                                </Badge>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                    <TournamentResultUpdate
                                                                                        entryId={latestEntry.entryId}
                                                                                        currentRank={latestEntry.rank}
                                                                                        currentBounty={latestEntry.bountyCount}
                                                                                        status={latestEntry.status}
                                                                                        onSuccess={fetchData}
                                                                                        hasBounty={latestEntry.hasBounty}
                                                                                        trigger={
                                                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent text-muted-foreground hover:text-foreground">
                                                                                                <Settings2 className="h-4 w-4" />
                                                                                            </Button>
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Web Ring */}
                                                    <div className="flex items-stretch border-b last:border-0">
                                                        <div className="w-24 flex-shrink-0 bg-muted px-2 py-2 border-r flex items-center justify-center text-[10px] font-bold text-foreground text-center leading-tight">
                                                            WEBコイン
                                                        </div>
                                                        <div className="flex-1 flex items-stretch overflow-hidden">
                                                            <div className="flex-1 flex gap-1 p-1 overflow-x-auto min-h-[64px] scrollbar-hide items-center">
                                                                {visit.ringGameEntries.filter(e => e.ringGameType === "WEB_COIN").map(entry => (
                                                                    entry.timeline.map((ev, i) => (
                                                                        <div key={i} className={cn(
                                                                            "border rounded px-2 py-1 text-[10px] min-w-[70px] bg-background shadow-sm",
                                                                            ev.eventType === "CASH_OUT" && "bg-orange-50/50 border-orange-200"
                                                                        )}>
                                                                            <div className="flex justify-between items-start">
                                                                                <span className="text-muted-foreground font-mono">{ev.timestamp}</span>
                                                                                <Badge variant="outline" className={cn(
                                                                                    "text-[8px] h-3 px-1 leading-none",
                                                                                    ev.eventType === "CASH_OUT" ? "bg-orange-100 text-orange-800" :
                                                                                        ev.eventType === "GIFT" ? "bg-blue-100 text-blue-800" : "bg-muted"
                                                                                )}>
                                                                                    {ev.eventType === "BUY_IN" ? "B" :
                                                                                        ev.eventType === "CASH_OUT" ? "C" :
                                                                                            ev.eventType === "GIFT" ? "G" : "W"}
                                                                                </Badge>
                                                                            </div>
                                                                            <div className={cn("font-bold", ev.eventType === "CASH_OUT" && "text-orange-600")}>
                                                                                {ev.chipAmount.toLocaleString()}
                                                                            </div>
                                                                            <div className="text-muted-foreground">
                                                                                {ev.eventType === "BUY_IN" ? "Buy-in" :
                                                                                    ev.eventType === "CASH_OUT" ? "Cash-out" :
                                                                                        ev.eventType === "GIFT" ? "Gift" : "Withdraw"}
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ))}
                                                                {(() => {
                                                                    const entry = visit.ringGameEntries.find(e => e.ringGameType === "WEB_COIN");
                                                                    return (
                                                                        <WebCoinRingGameDialog
                                                                            visitId={visit.id}
                                                                            playerName={visit.player.name}
                                                                            onSuccess={fetchData}
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

                                                            {(() => {
                                                                const entry = visit.ringGameEntries.find(e => e.ringGameType === "WEB_COIN");
                                                                if (!entry) return null;
                                                                const net = entry.totalCashOut - entry.totalBuyIn;
                                                                return (
                                                                    <div className="w-28 flex-shrink-0 flex items-center justify-start px-3 border-l bg-background/50 backdrop-blur-sm">
                                                                        {entry.totalCashOut > 0 && (
                                                                            <div className="flex flex-col items-start">
                                                                                <span className="text-[10px] text-muted-foreground leading-none mb-1">収支</span>
                                                                                <Badge variant="secondary" className={cn(
                                                                                    "h-6 font-bold text-[11px]",
                                                                                    net > 0 ? "bg-green-100 text-green-800 border-green-200" :
                                                                                        net < 0 ? "bg-red-100 text-red-800 border-red-200" :
                                                                                            "bg-slate-100 text-slate-800 border-slate-200"
                                                                                )}>
                                                                                    {net > 0 ? "+" : ""}{net.toLocaleString()}
                                                                                </Badge>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })()}
                                                        </div>
                                                    </div>

                                                    {/* Store Ring */}
                                                    <div className="flex items-stretch">
                                                        <div className="w-24 flex-shrink-0 bg-muted px-2 py-2 border-r flex items-center justify-center text-[10px] font-bold text-foreground text-center leading-tight">
                                                            店内リング
                                                        </div>
                                                        <div className="flex-1 flex items-stretch overflow-hidden">
                                                            <div className="flex-1 flex gap-1 p-1 overflow-x-auto min-h-[64px] items-center">
                                                                {visit.ringGameEntries.filter(e => e.ringGameType === "IN_STORE").map(entry => (
                                                                    entry.timeline.map((ev, i) => (
                                                                        <div key={i} className={cn(
                                                                            "border rounded px-2 py-1 text-[10px] min-w-[70px] bg-background shadow-sm",
                                                                            ev.eventType === "CASH_OUT" && "bg-orange-50/50 border-orange-200"
                                                                        )}>
                                                                            <div className="flex justify-between items-start">
                                                                                <span className="text-muted-foreground font-mono">{ev.timestamp}</span>
                                                                                <Badge variant="outline" className={cn(
                                                                                    "text-[8px] h-3 px-1 leading-none",
                                                                                    ev.eventType === "CASH_OUT" ? "bg-orange-100 text-orange-800" :
                                                                                        ev.eventType === "GIFT" ? "bg-blue-100 text-blue-800" : "bg-muted"
                                                                                )}>
                                                                                    {ev.eventType === "BUY_IN" ? "B" :
                                                                                        ev.eventType === "CASH_OUT" ? "C" :
                                                                                            ev.eventType === "GIFT" ? "G" : "W"}
                                                                                </Badge>
                                                                            </div>
                                                                            <div className={cn("font-bold", ev.eventType === "CASH_OUT" && "text-orange-600")}>
                                                                                {ev.chipAmount.toLocaleString()}
                                                                            </div>
                                                                            <div className="text-muted-foreground">
                                                                                {ev.eventType === "BUY_IN" ? "Buy-in" :
                                                                                    ev.eventType === "CASH_OUT" ? "Cash-out" :
                                                                                        ev.eventType === "GIFT" ? "Gift" : "Withdraw"}
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ))}
                                                                {(() => {
                                                                    const entry = visit.ringGameEntries.find(e => e.ringGameType === "IN_STORE");
                                                                    return (
                                                                        <InStoreRingGameDialog
                                                                            visitId={visit.id}
                                                                            playerName={visit.player.name}
                                                                            inStoreChipBalance={visit.player.inStoreChipBalance}
                                                                            buyInOptions={ringGameBuyInOptions}
                                                                            onSuccess={fetchData}
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

                                                            {(() => {
                                                                const entry = visit.ringGameEntries.find(e => e.ringGameType === "IN_STORE");
                                                                if (!entry) return null;
                                                                const net = entry.totalCashOut - entry.totalBuyIn;
                                                                return (
                                                                    <div className="w-28 flex-shrink-0 flex items-center justify-start px-3 border-l bg-background/50 backdrop-blur-sm">
                                                                        {entry.totalCashOut > 0 && (
                                                                            <div className="flex flex-col items-start">
                                                                                <span className="text-[10px] text-muted-foreground leading-none mb-1">収支</span>
                                                                                <Badge variant="secondary" className={cn(
                                                                                    "h-6 font-bold text-[11px]",
                                                                                    net > 0 ? "bg-green-100 text-green-800 border-green-200" :
                                                                                        net < 0 ? "bg-red-100 text-red-800 border-red-200" :
                                                                                            "bg-slate-100 text-slate-800 border-slate-200"
                                                                                )}>
                                                                                    {net > 0 ? "+" : ""}{net.toLocaleString()}
                                                                                </Badge>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <SettlementDialog
                                                    visitId={visit.id}
                                                    playerName={visit.player.name}
                                                    webCoinBalance={visit.player.webCoinBalance}
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
