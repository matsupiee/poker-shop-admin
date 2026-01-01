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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal } from "lucide-react"

export type Staff = {
    id: string
    name: string
    email: string
    image?: string | null
    createdAt: string
}

interface StaffListProps {
    initialStaff: Staff[]
}

export function StaffList({ initialStaff }: StaffListProps) {
    const [searchTerm, setSearchTerm] = useState("")

    const filteredStaff = initialStaff.filter(staff =>
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">スタッフ一覧</h1>
                    <p className="text-muted-foreground">
                        登録されているスタッフの管理が行えます。
                    </p>
                </div>
                {/* Placeholder for Create Staff Dialog - logic to be added later if needed */}
                <Button disabled variant="outline">
                    スタッフ登録 (未実装)
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>スタッフリスト</CardTitle>
                    <CardDescription>
                        全{initialStaff.length}名中 {filteredStaff.length}名を表示
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4 gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="名前またはメールアドレスで検索..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>名前</TableHead>
                                    <TableHead>メールアドレス</TableHead>
                                    <TableHead className="text-right">登録日</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStaff.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            該当するスタッフが見つかりません。
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStaff.map((staff) => (
                                        <TableRow key={staff.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={staff.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.name}`} alt={staff.name} />
                                                        <AvatarFallback>{staff.name.slice(0, 2)}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{staff.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{staff.email}</TableCell>
                                            <TableCell className="text-right">{staff.createdAt}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">メニューを開く</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>詳細を表示</DropdownMenuItem>
                                                        <DropdownMenuItem>編集する</DropdownMenuItem>
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
        </div>
    )
}
