"use server";

import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getAvailableDeposits(playerId: string) {
  const deposits = await prisma.webCoinDeposit.findMany({
    where: { playerId },
    include: {
      webCoinDepositWithdrawAmounts: true,
    },
  });
  return deposits.filter((deposit) => {
    const usedAmount = deposit.webCoinDepositWithdrawAmounts.reduce(
      (sum, wa) => sum + wa.amount,
      0
    );
    const availableAmount = deposit.depositAmount - usedAmount;
    return availableAmount > 0;
  });
}

/**
 * プレイヤーの有効なWebコイン合計額を計算する
 * (全ての入金合計 - 全ての出金合計)
 */
export async function getWebCoinBalance(playerId: string): Promise<number> {
  const availableDeposits = await getAvailableDeposits(playerId);
  return availableDeposits.reduce((sum, deposit) => {
    const usedAmount = deposit.webCoinDepositWithdrawAmounts.reduce(
      (sum, wa) => sum + wa.amount,
      0
    );
    const availableAmount = deposit.depositAmount - usedAmount;
    return sum + availableAmount;
  }, 0);
}

/**
 * 退店時にWebコインを入金する
 */
export async function depositWebCoinWhenCheckout(
  visitId: string,
  depositAmount: number,
  ptx: Prisma.TransactionClient
) {
  const visit = await ptx.visit.findUnique({
    where: { id: visitId },
    include: {
      player: true,
      webCoinRingEntry: { include: { webCoinRingChipEvents: true } },
    },
  });
  if (!visit) {
    throw new Error("来店データが見つかりません");
  }

  await ptx.webCoinDeposit.create({
    data: {
      playerId: visit.playerId,
      depositAmount,
      visitId,
    },
  });

  await ptx.player.update({
    where: {
      id: visit.playerId,
      webCoinBalance: visit.player.webCoinBalance,
    },
    data: {
      webCoinBalance: {
        increment: depositAmount,
      },
    },
  });

  revalidatePath("/players");
  revalidatePath("/daily-visits");
}

export async function withdrawWebCoinTransaction(input: {
  playerId: string;
  amount: number;
  currentBalance: number;
  ptx: Prisma.TransactionClient;
}) {
  const { playerId, amount, currentBalance, ptx } = input;

  // 1. 出金レコードの作成
  const withdraw = await ptx.webCoinWithdraw.create({
    data: {
      playerId,
      withdrawAmount: amount,
    },
  });

  // 2. 入金レコードとの紐付け (FIFO形式)
  // 未使用残高がある入金レコードを取得
  const deposits = await ptx.webCoinDeposit.findMany({
    where: { playerId },
    include: {
      webCoinDepositWithdrawAmounts: true,
    },
    orderBy: { createdAt: "asc" },
  });

  let remainingToWithdraw = amount;

  for (const deposit of deposits) {
    if (remainingToWithdraw <= 0) break;

    const usedAmount = deposit.webCoinDepositWithdrawAmounts.reduce(
      (sum, wa) => sum + wa.amount,
      0
    );
    const availableAmount = deposit.depositAmount - usedAmount;

    if (availableAmount > 0) {
      const amountFromThisDeposit = Math.min(
        availableAmount,
        remainingToWithdraw
      );

      await ptx.webCoinDepositWithdrawAmount.create({
        data: {
          webCoinDepositId: deposit.id,
          webCoinWithdrawId: withdraw.id,
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
  await ptx.player.update({
    // where条件を厳しくすることで、withdrawリクエストが重複した場合に不整合が起きるのを防ぐ
    where: { id: playerId, webCoinBalance: currentBalance },
    data: {
      webCoinBalance: {
        decrement: amount,
      },
    },
  });

  return withdraw;
}

/**
 * Webコインを引き出す
 */
export async function withdrawWebCoin(playerId: string, amount: number) {
  if (amount <= 0) throw new Error("引き出し額は0より大きい必要があります");

  const currentBalance = await getWebCoinBalance(playerId);
  if (currentBalance < amount) {
    throw new Error("残高が不足しています");
  }

  await prisma.$transaction(async (ptx) => {
    await withdrawWebCoinTransaction({
      playerId,
      amount,
      currentBalance,
      ptx,
    });
  });

  revalidatePath("/players");
  revalidatePath("/daily-visits");
}
