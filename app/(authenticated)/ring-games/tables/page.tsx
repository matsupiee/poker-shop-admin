import { prisma } from "@/lib/prisma";
import { TableCard } from "@/components/ring-games/table-card";
import { createDefaultTables } from "@/app/actions/ring-game-tables";

export default async function RingGameTablesPage() {
  // Ensure tables exist (simple auto-seed strategy for now)
  await createDefaultTables();

  const desks = await prisma.ringGameDesk.findMany({
    include: {
      ringGameDealerShifts: {
        where: { endedAt: null },
        include: { staff: true },
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  // Map to a cleaner structure for the client component
  const processedDesks = desks.map((desk) => ({
    id: desk.id,
    name: desk.name,
    activeShift: desk.ringGameDealerShifts[0]
      ? {
          id: desk.ringGameDealerShifts[0].id,
          staff: desk.ringGameDealerShifts[0].staff,
          startedAt: desk.ringGameDealerShifts[0].startedAt,
        }
      : null,
  }));

  const staffList = await prisma.staff.findMany({
    where: { role: { not: undefined } }, // Just fetch all for now
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Ring Game Tables
          </h1>
          <p className="text-muted-foreground mt-2">
            現在のテーブル状況とディーラー管理
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {processedDesks.map((desk) => (
          <TableCard key={desk.id} desk={desk} staffList={staffList} />
        ))}
      </div>

      {desks.length === 0 && (
        <div className="text-center py-20 bg-muted/50 rounded-xl border border-dashed">
          <p className="text-muted-foreground">テーブルがありません</p>
        </div>
      )}
    </div>
  );
}
