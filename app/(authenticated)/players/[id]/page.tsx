import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { PlayerDetail, ChipLog, Visit } from "@/components/players/player-detail"

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default async function PlayerDetailPage(props: PageProps) {
    const params = await props.params;
    const player = await prisma.player.findUnique({
        where: { id: params.id },
        include: {
            visits: {
                orderBy: { createdAt: 'desc' }
            },
            inStoreChipDeposits: {
                orderBy: { createdAt: 'desc' }
            },
            inStoreChipWithdraws: {
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    if (!player) {
        notFound()
    }

    const visits: Visit[] = player.visits.map(v => ({
        id: v.id,
        createdAt: v.createdAt,
        entranceFee: v.entranceFee,
        foodFee: v.foodFee
    }))

    const deposits: ChipLog[] = player.inStoreChipDeposits.map(d => ({
        id: d.id,
        type: 'deposit',
        amount: d.depositAmount,
        createdAt: d.createdAt
    }))

    const withdraws: ChipLog[] = player.inStoreChipWithdraws.map(w => ({
        id: w.id,
        type: 'withdraw',
        amount: w.withdrawAmount,
        createdAt: w.createdAt
    }))

    const chipLogs = [...deposits, ...withdraws].sort((a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime()
    )

    return (
        <PlayerDetail
            player={{
                id: player.id,
                name: player.name,
                memberId: player.memberId,
                webCoinBalance: player.webCoinBalance,
                inStoreCoinBalance: player.inStoreCoinBalance,
            }}
            visits={visits}
            chipLogs={chipLogs}
        />
    )
}
