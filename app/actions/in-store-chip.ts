"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getAvailableDeposits(playerId: string) {
  const deposits = await prisma.inStoreChipDeposit.findMany({
    where: { playerId },
    include: {
      inStoreChipDepositWithdrawAmounts: true,
    },
  });
  return deposits.filter((deposit) => {
    const usedAmount = deposit.inStoreChipDepositWithdrawAmounts.reduce(
      (sum, wa) => sum + wa.amount,
      0
    );
    const availableAmount = deposit.depositAmount - usedAmount;
    return availableAmount > 0;
  });
}

/**
 * プレイヤーの有効な店内チップ合計額を計算する
 * (全ての入金合計 - 全ての出金合計)
 */
export async function getInStoreChipBalance(playerId: string): Promise<number> {
  const availableDeposits = await getAvailableDeposits(playerId);
  return availableDeposits.reduce((sum, deposit) => {
    const usedAmount = deposit.inStoreChipDepositWithdrawAmounts.reduce(
      (sum, wa) => sum + wa.amount,
      0
    );
    const availableAmount = deposit.depositAmount - usedAmount;
    return sum + availableAmount;
  }, 0);
}

/**
 * 店内チップを入金する
 */
export async function depositInStoreChip(
  playerId: string,
  amount: number,
  visitId?: string
) {
  if (amount <= 0) throw new Error("入金額は0より大きい必要があります");

  await prisma.inStoreChipDeposit.create({
    data: {
      playerId,
      depositAmount: amount,
      visitId,
    },
  });

  revalidatePath("/players");
  revalidatePath("/daily-visits");
}

/**
 * 店内チップを引き出す
 * @param playerId プレイヤーID
 * @param amount 引き出し額
 * @param chipEventId オプション: 関連するInStoreRingChipEventのID
 */
export async function withdrawInStoreChip(
  playerId: string,
  amount: number,
  chipEventId?: string
) {
  if (amount <= 0) throw new Error("引き出し額は0より大きい必要があります");

  const currentBalance = await getInStoreChipBalance(playerId);
  if (currentBalance < amount) {
    throw new Error("残高が不足しています");
  }

  await prisma.$transaction(async (tx) => {
    // 1. 出金レコードの作成
    const withdraw = await tx.inStoreChipWithdraw.create({
      data: {
        playerId,
        withdrawAmount: amount,
        ...(chipEventId && { inStoreRingChipEventId: chipEventId }),
      },
    });

    // 2. 入金レコードとの紐付け (FIFO形式)
    // 未使用残高がある入金レコードを取得
    const deposits = await tx.inStoreChipDeposit.findMany({
      where: { playerId },
      include: {
        inStoreChipDepositWithdrawAmounts: true,
      },
      orderBy: { createdAt: "asc" },
    });

    let remainingToWithdraw = amount;

    for (const deposit of deposits) {
      if (remainingToWithdraw <= 0) break;

      const usedAmount = deposit.inStoreChipDepositWithdrawAmounts.reduce(
        (sum, wa) => sum + wa.amount,
        0
      );
      const availableAmount = deposit.depositAmount - usedAmount;

      if (availableAmount > 0) {
        const amountFromThisDeposit = Math.min(
          availableAmount,
          remainingToWithdraw
        );

        await tx.inStoreChipDepositWithdrawAmount.create({
          data: {
            inStoreChipDepositId: deposit.id,
            inStoreChipWithdrawId: withdraw.id,
            amount: amountFromThisDeposit,
          },
        });

        remainingToWithdraw -= amountFromThisDeposit;
      }
    }

    if (remainingToWithdraw > 0) {
      throw new Error("紐付け可能な入金データが不足しています");
    }

    // 最後にplayerテーブルの情報を更新
    await tx.player.update({
      // where条件を厳しくすることで、withdrawリクエストが重複した場合に不整合が起きるのを防ぐ
      where: { id: playerId, inStoreChipBalance: currentBalance },
      data: {
        inStoreChipBalance: {
          decrement: amount,
        },
      },
    });
  });

  revalidatePath("/players");
  revalidatePath("/daily-visits");
}
