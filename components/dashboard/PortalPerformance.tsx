import { getPortalDataForListing } from '@/lib/portals/queries'
import PortalCard from './PortalCard'

interface Props {
  listingId: string
  userId: string
}

export default async function PortalPerformance({ listingId, userId }: Props) {
  const portals = await getPortalDataForListing(listingId, userId)

  if (portals.length === 0) return null

  return (
    <div>
      <h2 className="text-[15px] font-semibold text-text-primary mb-3">
        Portal-Performance
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {portals.map(p => (
          <PortalCard key={p.slug} data={p} />
        ))}
      </div>
    </div>
  )
}
