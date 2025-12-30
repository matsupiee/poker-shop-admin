'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { BuyInOptionDialog } from './buy-in-option-dialog';
import { deleteRingGameBuyInOption } from '@/app/actions/ring-game-buy-in-options';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { RingGameBuyInOption } from '@/lib/generated/prisma/client';
import { RingGameType } from '@/lib/constants';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BuyInOptionListProps {
    options: RingGameBuyInOption[];
}

export function BuyInOptionList({ options }: BuyInOptionListProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<RingGameBuyInOption | null>(null);
    const router = useRouter();

    const handleCreate = () => {
        setSelectedOption(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (option: RingGameBuyInOption) => {
        setSelectedOption(option);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('本当に削除しますか？')) return;

        try {
            const result = await deleteRingGameBuyInOption(id);
            if (result.success) {
                toast.success('削除しました');
                router.refresh();
            } else {
                toast.error('削除に失敗しました');
            }
        } catch (error) {
            toast.error('予期せぬエラーが発生しました');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('ja-JP').format(num);
    };

    // Group by RingGameType for better display or just list them mixed?
    // Let's list mixed but maybe sorted or filterable. The server action sorts by chip amount.
    // Maybe explicit type labels are enough.

    return (
        <div>
            <div className="flex justify-end mb-4">
                <Button onClick={handleCreate}>新規作成</Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>種類</TableHead>
                            <TableHead className="text-right">チップ量</TableHead>
                            <TableHead className="text-right">支払い額</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {options.map((option) => (
                            <TableRow key={option.id}>
                                <TableCell>
                                    {option.ringGameType === RingGameType.WEB_COIN ? (
                                        <Badge variant="default">
                                            WEBコイン
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline">
                                            店内リング
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">{formatNumber(option.chipAmount)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(option.chargeAmount)}</TableCell>
                                <TableCell>
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(option)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground"
                                            onClick={() => handleDelete(option.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {options.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    データがありません
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <BuyInOptionDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                option={selectedOption}
            />
        </div>
    );
}
