"use client";

import * as React from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Plus,
  Users,
  Clock,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateTournamentDialog } from "@/components/tournaments/create-tournament-dialog";
import { EditTournamentDialog } from "@/components/tournaments/edit-tournament-dialog";
import { getTournaments } from "@/app/actions/tournaments";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function DailyTournamentsPage() {
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [tournaments, setTournaments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchTournaments = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTournaments(date);
      setTournaments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [date]);

  React.useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  // In a real app, fetch tournaments for 'date' here
  const displayDate = date
    ? format(date, "yyyy年MM月dd日 (E)", { locale: ja })
    : "全ての期間";

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            トーナメント開催一覧
          </h1>
          <p className="text-muted-foreground">
            {displayDate}の開催スケジュール
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
                {date ? (
                  format(date, "PPP", { locale: ja })
                ) : (
                  <span>日付を選択</span>
                )}
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
          <CreateTournamentDialog onTournamentCreated={fetchTournaments} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {tournaments.map((tournament) => {
              const eventDate = new Date(tournament.startAt);
              const startTime = format(eventDate, "HH:mm");
              const now = new Date();
              // Simple status logic
              let status = "upcoming";
              if (eventDate < now) {
                // Assume 5 hours duration for simplicity to determine "finished"
                if (now.getTime() - eventDate.getTime() > 5 * 60 * 60 * 1000) {
                  status = "finished";
                } else {
                  status = "running";
                }
              }

              return (
                <Link
                  key={tournament.id}
                  href={`/tournaments/${tournament.id}`}
                  className="h-full"
                >
                  <Card className="flex flex-col h-full">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "mb-2",
                            status === "registering" &&
                              "bg-green-100 text-green-800 border-green-200",
                            status === "running" &&
                              "bg-blue-100 text-blue-800 border-blue-200",
                            status === "finished" &&
                              "bg-gray-100 text-gray-800 border-gray-200",
                            status === "upcoming" &&
                              "bg-yellow-50 text-yellow-800 border-yellow-200"
                          )}
                        >
                          {status === "upcoming"
                            ? "開催前"
                            : status === "registering"
                              ? "エントリー受付中"
                              : status === "running"
                                ? "進行中"
                                : status === "finished"
                                  ? "終了"
                                  : "中止"}
                        </Badge>
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <div className="text-sm font-medium text-muted-foreground flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {startTime}
                          </div>
                          <EditTournamentDialog
                            tournament={tournament}
                            onTournamentUpdated={fetchTournaments}
                          />
                        </div>
                      </div>
                      <CardTitle className="leading-tight">
                        {tournament.name}
                      </CardTitle>
                      <CardDescription>Buy-in: 設定なし</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">
                            エントリー
                          </span>
                          <div className="flex items-end gap-1">
                            <Users className="w-5 h-5 mb-0.5 text-primary" />
                            <span className="text-xl font-bold">
                              {tournament._count?.entries || 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">
                            プライズ総額
                          </span>
                          <div className="flex items-end gap-1">
                            <Trophy className="w-5 h-5 mb-0.5 text-yellow-600" />
                            <span className="text-sm font-medium pt-1">
                              {tournament.tournamentPrizes &&
                              tournament.tournamentPrizes.length > 0
                                ? `${tournament.tournamentPrizes.reduce((sum: number, p: any) => sum + p.amount, 0).toLocaleString()}`
                                : "未確定"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </>
        )}

        {/* Empty state card if no tournaments - mocked to show create option */}
        <CreateTournamentDialog onTournamentCreated={fetchTournaments}>
          <Card className="flex flex-col items-center justify-center border-dashed h-full min-h-[200px] cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex flex-col items-center gap-2 text-muted-foreground p-6">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Plus className="h-6 w-6" />
              </div>
              <span className="font-medium">イベントを追加</span>
            </div>
          </Card>
        </CreateTournamentDialog>
      </div>
    </div>
  );
}
