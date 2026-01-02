"use server";

import { prisma } from "@/lib/prisma";
import {
  type InStoreRingBuyInOption,
  RingGameType,
} from "@/lib/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

export type RingGameBuyInOption = InStoreRingBuyInOption & {
  ringGameType: RingGameType;
};

async function checkAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error("Unauthorized");
  }
}

export async function getRingGameBuyInOptions() {
  await checkAuth();
  const [inStoreOptions] = await Promise.all([
    prisma.inStoreRingBuyInOption.findMany(),
  ]);

  const options = [
    ...inStoreOptions.map((o) => ({
      ...o,
      ringGameType: RingGameType.IN_STORE,
    })),
  ];

  return options.sort((a, b) => {
    return a.chargeAmount - b.chargeAmount;
  });
}

export type CreateRingGameBuyInOptionInput = {
  ringGameType: RingGameType;
  chipAmount: number;
  chargeAmount: number;
};

export async function createRingGameBuyInOption(
  input: CreateRingGameBuyInOptionInput
) {
  try {
    await checkAuth();
    const { ringGameType, chipAmount, chargeAmount } = input;

    let option;
    if (ringGameType === RingGameType.WEB_COIN) {
      throw new Error("WEB_COIN does not support buy-in options");
    } else {
      option = await prisma.inStoreRingBuyInOption.create({
        data: { chipAmount, chargeAmount },
      });
    }

    revalidatePath("/ring-games/in-store-buy-in-options");
    return { success: true, data: { ...option, ringGameType } };
  } catch (error) {
    console.error("Failed to create ring game buy-in option:", error);
    return { success: false, error: "Failed to create option" };
  }
}

export type UpdateRingGameBuyInOptionInput = {
  id: string;
  ringGameType: RingGameType;
  chipAmount: number;
  chargeAmount: number;
};

export async function updateRingGameBuyInOption(
  input: UpdateRingGameBuyInOptionInput
) {
  try {
    await checkAuth();
    const { id, ringGameType, chipAmount, chargeAmount } = input;

    let option;
    if (ringGameType === RingGameType.WEB_COIN) {
      throw new Error("WEB_COIN does not support buy-in options");
    } else {
      option = await prisma.inStoreRingBuyInOption.update({
        where: { id },
        data: { chipAmount, chargeAmount },
      });
    }

    revalidatePath("/ring-games/in-store-buy-in-options");
    return { success: true, data: { ...option, ringGameType } };
  } catch (error) {
    console.error("Failed to update ring game buy-in option:", error);
    return { success: false, error: "Failed to update option" };
  }
}

export async function deleteRingGameBuyInOption(
  id: string,
  ringGameType: RingGameType
) {
  try {
    await checkAuth();
    if (ringGameType === RingGameType.WEB_COIN) {
      throw new Error("WEB_COIN does not support buy-in options");
    } else {
      await prisma.inStoreRingBuyInOption.delete({
        where: { id },
      });
    }

    revalidatePath("/ring-games/in-store-buy-in-options");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete ring game buy-in option:", error);
    return { success: false, error: "Failed to delete option" };
  }
}
