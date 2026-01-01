"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export type Visit = {
    id: string
    createdAt: Date
    entranceFee: number | null
    foodFee: number | null
}

export type ChipLog = {
    id: string
    type: "deposit" | "withdraw"
    amount: number
    createdAt: Date
}

type PlayerDetailProps = {
    player: {
        id: string
        name: string
        memberId: string
        webCoinBalance: number
        inStoreChipBalance: number
    }
    visits: Visit[]
    chipLogs: ChipLog[]
}

export function PlayerDetail({ player, visits, chipLogs }: PlayerDetailProps) {
    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/players">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{player.name}</h1>
                    <p className="text-muted-foreground">
                        会員ID: {player.memberId}
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">預け入れ中webコイン</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{player.webCoinBalance.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">店内リング 貯チップ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{player.inStoreChipBalance.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">総来店回数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{visits.length} 回</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="visits" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="visits">来店履歴</TabsTrigger>
                    <TabsTrigger value="chips">チップ履歴</TabsTrigger>
                </TabsList>
                <TabsContent value="visits" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>来店履歴</CardTitle>
                            <CardDescription>過去の来店記録です。</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>日時</TableHead>
                                            <TableHead>エントランス料</TableHead>
                                            <TableHead>飲食代</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {visits.map((visit) => (
                                            <TableRow key={visit.id}>
                                                <TableCell>{format(new Date(visit.createdAt), "yyyy/MM/dd HH:mm")}</TableCell>
                                                <TableCell>{visit.entranceFee?.toLocaleString() ?? "-"} 円</TableCell>
                                                <TableCell>{visit.foodFee?.toLocaleString() ?? "-"} 円</TableCell>
                                            </TableRow>
                                        ))}
                                        {visits.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                                    来店履歴がありません
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="chips" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>チップ履歴</CardTitle>
                            <CardDescription>チップの預け入れ・引き出し記録です。</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>日時</TableHead>
                                            <TableHead>種別</TableHead>
                                            <TableHead className="text-right">金額</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {chipLogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell>{format(new Date(log.createdAt), "yyyy/MM/dd HH:mm")}</TableCell>
                                                <TableCell>{log.type === "deposit" ? "預入" : "引出"}</TableCell>
                                                <TableCell className={`text-right font-bold ${log.type === "deposit" ? "text-green-600" : "text-red-600"}`}>
                                                    {log.type === "deposit" ? "+" : "-"}{log.amount.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {chipLogs.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                                    チップ履歴がありません
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
