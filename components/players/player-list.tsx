"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, UserPlus, Filter, ArrowUpDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { CreatePlayerDialog } from "./create-player-dialog"
import { EditPlayerDialog } from "./edit-player-dialog"
import { RegisterVisitDialog } from "@/components/visits/register-visit-dialog"

export type Player = {
    id: string
    memberId: string
    name: string
    gameId?: string
    webCoinBalance: number
    inStoreChipBalance: number
    visitCount: number
    lastVisit: string
    status: "active" | "inactive" | "banned"
}

interface PlayerListProps {
    initialPlayers: Player[]
}

export function PlayerList({ initialPlayers }: PlayerListProps) {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedPlayerForVisit, setSelectedPlayerForVisit] = useState<Player | null>(null)
    const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false)
    const [selectedPlayerForEdit, setSelectedPlayerForEdit] = useState<Player | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    const filteredPlayers = initialPlayers.filter(player =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.memberId.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">プレイヤー一覧</h1>
                    <p className="text-muted-foreground">
                        登録されているプレイヤーの管理、検索、詳細確認が行えます。
                    </p>
                </div>
                <CreatePlayerDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>プレイヤーリスト</CardTitle>
                    <CardDescription>
                        全{initialPlayers.length}名中 {filteredPlayers.length}名を表示
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                <Filter className="mr-2 h-4 w-4" /> フィルター
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">会員ID</TableHead>
                                    <TableHead>名前</TableHead>
                                    <TableHead>ステータス</TableHead>
                                    <TableHead className="text-right">
                                        預け入れ中<br />webコイン
                                    </TableHead>
                                    <TableHead className="text-right">
                                        店内リング<br />貯チップ
                                    </TableHead>
                                    <TableHead className="text-right">来店回数</TableHead>
                                    <TableHead className="text-right">最終来店日</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPlayers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            該当するプレイヤーが見つかりません。
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPlayers.map((player) => (
                                        <TableRow key={player.id}>
                                            <TableCell className="font-medium">{player.memberId}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} alt={player.name} />
                                                        <AvatarFallback>{player.name.slice(0, 2)}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{player.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        player.status === "active" ? "default" :
                                                            player.status === "inactive" ? "secondary" : "destructive"
                                                    }
                                                >
                                                    {player.status === "active" ? "有効" :
                                                        player.status === "inactive" ? "休眠" : "利用停止"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {player.webCoinBalance.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {player.inStoreChipBalance.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">{player.visitCount}回</TableCell>
                                            <TableCell className="text-right">{player.lastVisit}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">メニューを開く</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>アクション</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(player.memberId)}>
                                                            会員IDをコピー
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedPlayerForVisit(player)
                                                            setIsVisitDialogOpen(true)
                                                        }}>
                                                            来店登録
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => router.push(`/players/${player.id}`)}>詳細を表示</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedPlayerForEdit(player)
                                                            setIsEditDialogOpen(true)
                                                        }}>
                                                            編集する
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">削除する</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <RegisterVisitDialog
                player={selectedPlayerForVisit}
                open={isVisitDialogOpen}
                onOpenChange={setIsVisitDialogOpen}
            />

            <EditPlayerDialog
                key={selectedPlayerForEdit?.id}
                player={selectedPlayerForEdit}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
            />
        </div >
    )
}
