'use server';

import { prisma } from '@/lib/prisma';
import { type RingGameBuyInOption, RingGameType } from '@/lib/generated/prisma/client';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';

async function checkAuth() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) {
        throw new Error('Unauthorized');
    }
}

export async function getRingGameBuyInOptions() {
    await checkAuth();
    return prisma.ringGameBuyInOption.findMany({
        orderBy: {
            chipAmount: 'asc',
        },
    });
}

export type CreateRingGameBuyInOptionInput = {
    ringGameType: RingGameType;
    chipAmount: number;
    chargeAmount: number;
};

export async function createRingGameBuyInOption(input: CreateRingGameBuyInOptionInput) {
    try {
        await checkAuth();
        const { ringGameType, chipAmount, chargeAmount } = input;
        const option = await prisma.ringGameBuyInOption.create({
            data: {
                ringGameType,
                chipAmount,
                chargeAmount,
            },
        });

        revalidatePath('/ring-games/buy-in-options');
        return { success: true, data: option };
    } catch (error) {
        console.error('Failed to create ring game buy-in option:', error);
        return { success: false, error: 'Failed to create option' };
    }
}

export type UpdateRingGameBuyInOptionInput = {
    id: string;
    ringGameType: RingGameType;
    chipAmount: number;
    chargeAmount: number;
};

export async function updateRingGameBuyInOption(input: UpdateRingGameBuyInOptionInput) {
    try {
        await checkAuth();
        const { id, ringGameType, chipAmount, chargeAmount } = input;
        const option = await prisma.ringGameBuyInOption.update({
            where: { id },
            data: {
                ringGameType,
                chipAmount,
                chargeAmount,
            },
        });

        revalidatePath('/ring-games/buy-in-options');
        return { success: true, data: option };
    } catch (error) {
        console.error('Failed to update ring game buy-in option:', error);
        return { success: false, error: 'Failed to update option' };
    }
}

export async function deleteRingGameBuyInOption(id: string) {
    try {
        await checkAuth();
        await prisma.ringGameBuyInOption.delete({
            where: { id },
        });

        revalidatePath('/ring-games/buy-in-options');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete ring game buy-in option:', error);
        return { success: false, error: 'Failed to delete option' };
    }
}
