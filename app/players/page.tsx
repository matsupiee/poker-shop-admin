import { prisma } from "@/lib/prisma"
import { PlayerList, Player } from "@/components/players/player-list"
import { format } from "date-fns"

export default async function PlayersPage() {
    const playersData = await prisma.player.findMany({
        include: {
            storeCoin: true,
            _count: {
                select: { visitations: true }
            },
            visitations: {
                orderBy: { visitDate: 'desc' },
                take: 1
            }
        },
        orderBy: {
            memberId: 'asc'
        }
    })

    const formattedPlayers: Player[] = playersData.map(p => ({
        id: p.id,
        memberId: p.memberId.toString(),
        name: p.name,
        balance: p.storeCoin?.balance ?? 0,
        visitCount: p._count.visitations,
        lastVisit: p.visitations[0] ? format(p.visitations[0].visitDate, 'yyyy-MM-dd') : "-",
        status: "active"
    }))

    return <PlayerList initialPlayers={formattedPlayers} />
}
