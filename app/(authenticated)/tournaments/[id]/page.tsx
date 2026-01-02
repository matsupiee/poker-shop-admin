import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar, Clock, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TournamentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TournamentDetailPage(
  props: TournamentDetailPageProps
) {
  const params = await props.params;
  const tournament = await prisma.tournament.findUnique({
    where: {
      id: params.id,
    },
    include: {
      _count: {
        select: { entries: true },
      },
      tournamentPrizes: {
        orderBy: {
          rank: "asc",
        },
      },
      entries: {
        include: {
          visit: {
            include: {
              player: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!tournament) {
    notFound();
  }

  const eventDate = new Date(tournament.startAt);
  const now = new Date();
  let status = "upcoming";
  if (eventDate < now) {
    // Assume 5 hours duration for simplicity to determine "finished"
    // This logic mimics the one in the list page
    if (now.getTime() - eventDate.getTime() > 5 * 60 * 60 * 1000) {
      status = "finished";
    } else {
      status = "running";
    }
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <span>トーナメント</span>
          <span>/</span>
          <span>詳細・管理</span>
        </div>

        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge
                variant="outline"
                className={
                  status === "registering"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : status === "running"
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : status === "finished"
                        ? "bg-gray-100 text-gray-800 border-gray-200"
                        : "bg-yellow-50 text-yellow-800 border-yellow-200" // upcoming
                }
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
              <span className="text-muted-foreground flex items-center gap-1 text-sm">
                <Calendar className="w-4 h-4" />
                {format(eventDate, "yyyy年MM月dd日 (E)", { locale: ja })}
              </span>
              <span className="text-muted-foreground flex items-center gap-1 text-sm">
                <Clock className="w-4 h-4" />
                {format(eventDate, "HH:mm")}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {tournament.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>参加プレイヤー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tournament.entries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    まだ参加者はいません
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tournament.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {entry.visit.player.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">
                              {entry.visit.player.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {entry.visit.player.memberId}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm">
                          {format(entry.createdAt, "HH:mm")} エントリー
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>トーナメント情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  エントリー数
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {tournament._count.entries}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  プライズ総額
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <span className="text-2xl font-bold">
                    {tournament.tournamentPrizes
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="pt-2 space-y-2">
                {tournament.tournamentPrizes.map((prize) => (
                  <div key={prize.id} className="flex justify-between text-sm">
                    <span className="font-medium">{prize.rank}位</span>
                    <span className="text-muted-foreground">
                      {prize.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>スケジュール</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">開始時刻</span>
                <span className="font-medium">
                  {format(eventDate, "HH:mm")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">締切時刻</span>
                <span className="font-medium">
                  {format(new Date(tournament.entryClosesAt), "HH:mm")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
