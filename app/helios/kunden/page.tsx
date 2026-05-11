import { fetchAlleKunden } from '@/lib/helios/sources/supabase'
import { PageWrapper } from '@/lib/helios/components/layout/PageWrapper'
import { KundenTableIsland } from './KundenTableIsland'

export default async function HeliosKundenPage() {
  const kunden = await fetchAlleKunden()

  return (
    <PageWrapper
      title="Kunden"
      subtitle={`${kunden.length} zahlende Kunden`}
    >
      <KundenTableIsland kunden={kunden} />
    </PageWrapper>
  )
}
