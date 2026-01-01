import { Suspense } from "react"
import { format } from "date-fns"
import { getDashboardStats } from "@/app/actions/dashboard"
import { DashboardView } from "@/components/dashboard/dashboard-view"

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DashboardPage({ searchParams }: Props) {
  // Await searchParams before accessing properties
  const params = await searchParams

  // Get month from searchParams or default to current month
  let month = typeof params.month === 'string' ? params.month : format(new Date(), "yyyy-MM")

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
