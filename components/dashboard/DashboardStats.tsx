import { getDashboardStats } from '@/lib/dashboard/stats'
import DashboardStatsClient from './DashboardStatsClient'

interface Props {
  listingId: string
  userId: string
}

export default async function DashboardStats({ listingId, userId }: Props) {
  const stats = await getDashboardStats(listingId, userId)
  return <DashboardStatsClient stats={stats} />
}
