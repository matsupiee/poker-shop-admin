import { Suspense } from "react"
import { format } from "date-fns"
import { getDashboardStats } from "@/app/actions/dashboard"
import { DashboardView } from "@/components/dashboard/dashboard-view"

type Props = {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function DashboardPage({ searchParams }: Props) {
  // Get month from searchParams or default to current month
  let month = typeof searchParams.month === 'string' ? searchParams.month : format(new Date(), "yyyy-MM")

  // Validate format (simple check)
  if (!/^\d{4}-\d{2}$/.test(month)) {
    month = format(new Date(), "yyyy-MM")
  }

  const stats = await getDashboardStats(month)

  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardView month={month} stats={stats} />
    </Suspense>
  )
}
