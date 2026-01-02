import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  PlayerDetail,
  ChipLog,
  Visit,
} from "@/components/players/player-detail";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PlayerDetailPage(props: PageProps) {
  const params = await props.params;
  const player = await prisma.player.findUnique({
    where: { id: params.id },
    include: {
      visits: {
        orderBy: { createdAt: "desc" },
      },
      webCoinDeposits: {
        orderBy: { createdAt: "desc" },
      },
      webCoinWithdraws: {
        orderBy: { createdAt: "desc" },
      },
      inStoreChipDeposits: {
        orderBy: { createdAt: "desc" },
      },
      inStoreChipWithdraws: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!player) {
    notFound();
  }

  const visits: Visit[] = player.visits.map((v) => ({
    id: v.id,
    createdAt: v.createdAt,
    entranceFee: v.entranceFee,
    foodFee: v.foodFee,
  }));

  const webCoinDeposits: ChipLog[] = player.webCoinDeposits.map((d) => ({
    id: d.id,
    type: "deposit",
    chipType: "web_coin",
    amount: d.depositAmount,
    createdAt: d.createdAt,
  }));

  const webCoinWithdraws: ChipLog[] = player.webCoinWithdraws.map((w) => ({
    id: w.id,
    type: "withdraw",
    chipType: "web_coin",
    amount: w.withdrawAmount,
    createdAt: w.createdAt,
  }));

  const webCoinLogs = [...webCoinDeposits, ...webCoinWithdraws].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  const inStoreChipDeposits: ChipLog[] = player.inStoreChipDeposits.map(
    (d) => ({
      id: d.id,
      type: "deposit",
      chipType: "in_store_chip",
      amount: d.depositAmount,
      createdAt: d.createdAt,
    })
  );

  const inStoreChipWithdraws: ChipLog[] = player.inStoreChipWithdraws.map(
    (w) => ({
      id: w.id,
      type: "withdraw",
      chipType: "in_store_chip",
      amount: w.withdrawAmount,
      createdAt: w.createdAt,
    })
  );

  const inStoreChipLogs = [
    ...inStoreChipDeposits,
    ...inStoreChipWithdraws,
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <PlayerDetail
      player={{
        id: player.id,
        name: player.name,
        memberId: player.memberId,
        webCoinBalance: player.webCoinBalance,
        inStoreChipBalance: player.inStoreChipBalance,
      }}
      visits={visits}
      webCoinLogs={webCoinLogs}
      inStoreChipLogs={inStoreChipLogs}
    />
  );
}
