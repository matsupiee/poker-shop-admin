import { prisma } from "@/lib/prisma";
import { StaffList, Staff } from "@/components/staff/staff-list";
import { format } from "date-fns";

export default async function StaffPage() {
  const staffData = await prisma.staff.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedStaff: Staff[] = staffData.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    image: s.image,
    createdAt: format(s.createdAt, "yyyy-MM-dd"),
  }));

  return <StaffList initialStaff={formattedStaff} />;
}
