import { fetchVerkaufteListings } from '@/lib/helios/sources/supabase'
import type { HeliosListing } from '@/lib/helios/sources/supabase'

export interface VerkaufsMetriken {
  totalCount: number
  avgPreisEur: number | null   // null if no listings with preis
  avgDaysToSale: number | null // null if no listings with verkaufAm — never 0
  daysToSaleN: number          // count of listings used for avgDaysToSale calculation
  nachTier: Record<string, number>  // count of sales per tier
}

export async function fetchVerkaufsListe(
  zeitraum: { von: string; bis: string }
): Promise<HeliosListing[]> {
  return fetchVerkaufteListings(zeitraum)
}

export async function getVerkaufsMetriken(
  zeitraum: { von: string; bis: string }
): Promise<VerkaufsMetriken> {
  const liste = await fetchVerkaufteListings(zeitraum)

  const totalCount = liste.length

  // avg price in EUR
  const mitPreis = liste.filter((l) => l.preis != null)
  const avgPreisEur = mitPreis.length === 0
    ? null
    : Math.round(mitPreis.reduce((s, l) => s + (l.preis ?? 0), 0) / mitPreis.length)

  // avg days from created_at to verkaufAm
  // Source: listings.verkauft_am (set by setListingStatus 'verkauft')
  // Filter: only listings where verkaufAm IS NOT NULL — no updated_at fallback
  const mitDatum = liste.filter((l) => l.verkaufAm != null)
  let avgDaysToSale: number | null = null
  if (mitDatum.length > 0) {
    const totalDays = mitDatum.reduce((sum, l) => {
      const days = Math.floor(
        (new Date(l.verkaufAm!).getTime() - new Date(l.createdAt).getTime()) / 86_400_000
      )
      return sum + Math.max(0, days)
    }, 0)
    avgDaysToSale = Math.round(totalDays / mitDatum.length)
  }

  // count of sales per paket tier
  const nachTier: Record<string, number> = {}
  for (const l of liste) {
    const tier = l.paketTier ?? 'unbekannt'
    nachTier[tier] = (nachTier[tier] ?? 0) + 1
  }

  return {
    totalCount,
    avgPreisEur,
    avgDaysToSale,
    daysToSaleN: mitDatum.length,
    nachTier,
  }
}
