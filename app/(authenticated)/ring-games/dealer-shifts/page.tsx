import { prisma } from "@/lib/prisma";
import { DealerShiftDialog } from "@/components/ring-games/dealer-shift-dialog";
import { DealerShiftList } from "@/components/ring-games/dealer-shift-list";

export default async function DealerShiftsPage() {
  const staffList = await prisma.staff.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  const desks = await prisma.ringGameDesk.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const shifts = await prisma.ringGameDealerShift.findMany({
    orderBy: { startedAt: "desc" },
    include: {
      staff: true,
      ringGameDesk: true,
    },
    take: 100, // Limit to recent 100
  });

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">ディーラー稼働記録</h1>
        <DealerShiftDialog staffList={staffList} deskList={desks} />
      </div>

      <DealerShiftList shifts={shifts} staffList={staffList} deskList={desks} />
    </div>
  );
}
