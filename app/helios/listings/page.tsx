import { fetchAlleListings } from '@/lib/helios/sources/supabase'
import { PageWrapper } from '@/lib/helios/components/layout/PageWrapper'
import { ListingsTableIsland } from './ListingsTableIsland'

export default async function HeliosListingsPage() {
  const listings = await fetchAlleListings()

  return (
    <PageWrapper
      title="Listings"
      subtitle={`${listings.length} Listings gesamt`}
    >
      <ListingsTableIsland listings={listings} />
    </PageWrapper>
  )
}
