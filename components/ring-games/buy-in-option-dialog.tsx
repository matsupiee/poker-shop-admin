'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { RingGameBuyInOption } from '@/lib/generated/prisma/client';
import { RingGameType, type RingGameTypeKey } from '@/lib/constants'; // Use local constant for client
import { useState, useEffect } from 'react';
import {
    createRingGameBuyInOption,
    updateRingGameBuyInOption,
} from '@/app/actions/ring-game-buy-in-options';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface BuyInOptionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    option?: RingGameBuyInOption | null;
}

export function BuyInOptionDialog({
    open,
    onOpenChange,
    option,
}: BuyInOptionDialogProps) {
    // edit mode only
    const [ringGameType, setRingGameType] = useState<RingGameTypeKey>(RingGameType.WEB_COIN);
    const [chipAmount, setChipAmount] = useState('');
    const [chargeAmount, setChargeAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (option) {
            setRingGameType(option.ringGameType);
            setChipAmount(option.chipAmount.toString());
            setChargeAmount(option.chargeAmount.toString());
        } else {
            setRingGameType(RingGameType.WEB_COIN);
            setChipAmount('');
            setChargeAmount('');
        }
    }, [option, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const parsedChipAmount = parseInt(chipAmount);
            const parsedChargeAmount = parseInt(chargeAmount);

            if (isNaN(parsedChipAmount) || isNaN(parsedChargeAmount)) {
                toast.error('数値以外が入力されています');
                setIsSubmitting(false);
                return;
            }

            if (parsedChipAmount < 1) {
                toast.error('チップ量は1以上を入力してください');
                setIsSubmitting(false);
                return;
            }

            if (parsedChargeAmount < 0) {
                toast.error('支払い額は0以上を入力してください');
                setIsSubmitting(false);
                return;
            }

            if (option) {
                // Update
                const result = await updateRingGameBuyInOption({
                    id: option.id,
                    ringGameType,
                    chipAmount: parsedChipAmount,
                    chargeAmount: parsedChargeAmount,
                });

                if (result.success) {
                    toast.success('更新しました');
                    onOpenChange(false);
                    router.refresh();
                } else {
                    toast.error('更新に失敗しました');
                }
            } else {
                // Create
                const result = await createRingGameBuyInOption({
                    ringGameType,
                    chipAmount: parsedChipAmount,
                    chargeAmount: parsedChargeAmount,
                });

                if (result.success) {
                    toast.success('作成しました');
                    onOpenChange(false);
                    router.refresh();
                } else {
                    toast.error('作成に失敗しました');
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('予期せぬエラーが発生しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {option ? 'バイインオプション編集' : '新規バイインオプション作成'}
                    </DialogTitle>
                    <DialogDescription>
                        リングゲームのバイインオプションを設定します。
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">
                                種類
                            </Label>
                            <Select
                                value={ringGameType}
                                onValueChange={(value) => setRingGameType(value as RingGameTypeKey)}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="種類を選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={RingGameType.WEB_COIN}>WEBコイン</SelectItem>
                                    <SelectItem value={RingGameType.IN_STORE}>店内リング</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="chipAmount" className="text-right">
                                チップ量
                            </Label>
                            <Input
                                id="chipAmount"
                                type="number"
                                min="1"
                                value={chipAmount}
                                onChange={(e) => setChipAmount(e.target.value)}
                                className="col-span-3"
                                placeholder="例: 20000"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="chargeAmount" className="text-right">
                                支払い額
                            </Label>
                            <Input
                                id="chargeAmount"
                                type="number"
                                min="0"
                                value={chargeAmount}
                                onChange={(e) => setChargeAmount(e.target.value)}
                                className="col-span-3"
                                placeholder="例: 2000"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? '保存中...' : '保存'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
