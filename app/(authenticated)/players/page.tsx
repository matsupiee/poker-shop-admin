import { prisma } from "@/lib/prisma"
import { PlayerList, Player } from "@/components/players/player-list"
import { format } from "date-fns"

export default async function PlayersPage() {
    const playersData = await prisma.player.findMany({
        include: {
            _count: {
                select: { visitations: true }
            },
            visitations: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        },
        orderBy: {
            memberId: 'asc'
        }
    })

    const formattedPlayers: Player[] = playersData.map(p => ({
        id: p.id,
        memberId: p.memberId,
        name: p.name,
        gameId: p.webCoinGameId ?? undefined,
        balance: p.storeCoinBalance,
        visitCount: p._count.visitations,
        lastVisit: p.visitations[0] ? format(p.visitations[0].createdAt, 'yyyy-MM-dd') : "-",
        status: "active"
    }))

    return <PlayerList initialPlayers={formattedPlayers} />
}
