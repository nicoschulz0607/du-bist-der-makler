import { createClient } from '@/lib/supabase/server'
import { PORTALS, type PortalSlug, type PortalStatus } from './config'

export interface PortalCardData {
  slug: PortalSlug
  name: string
  domain: string
  publicSite: string
  status: PortalStatus
  aufrufe_7tage: number | null
  aufrufe_gesamt: number | null
  anfragen_anzahl: number
  letzte_sync_at: string | null
  listing_url: string | null
}

/**
 * Liefert Portal-Daten für ein Listing, sortiert nach Reihenfolge.
 * Returnt leere Liste wenn keine Einträge vorhanden — UI zeigt dann nichts.
 */
export async function getPortalDataForListing(
  listingId: string,
  userId: string
): Promise<PortalCardData[]> {
  try {
    const supabase = await createClient()

    const [portalsRes, interessentenRes] = await Promise.all([
      supabase
        .from('listing_portals')
        .select('*')
        .eq('listing_id', listingId)
        .eq('user_id', userId),
      supabase
        .from('interessenten')
        .select('quelle')
        .eq('listing_id', listingId),
    ])

    const portalsRaw = portalsRes.data ?? []
    const interessenten = interessentenRes.data ?? []

    const anfragenMap: Record<string, number> = {}
    for (const i of interessenten) {
      const quelle = (i.quelle as string)?.toLowerCase()?.trim()
      if (!quelle) continue

      let mappedSlug: PortalSlug | null = null
      if (quelle.includes('immoscout') || quelle.includes('immobilienscout')) mappedSlug = 'immoscout'
      else if (quelle.includes('immowelt')) mappedSlug = 'immowelt'
      else if (quelle.includes('ebay') || quelle.includes('kleinanzeigen')) mappedSlug = 'ebay_kleinanzeigen'

      if (mappedSlug) {
        anfragenMap[mappedSlug] = (anfragenMap[mappedSlug] ?? 0) + 1
      }
    }

    const result: PortalCardData[] = []
    for (const config of PORTALS) {
      const portalRow = portalsRaw.find(p => p.portal_slug === config.slug)
      if (!portalRow) continue

      result.push({
        slug: config.slug,
        name: config.name,
        domain: config.domain,
        publicSite: config.publicSite,
        status: portalRow.status as PortalStatus,
        aufrufe_7tage: portalRow.aufrufe_7tage,
        aufrufe_gesamt: portalRow.aufrufe_gesamt,
        anfragen_anzahl: anfragenMap[config.slug] ?? 0,
        letzte_sync_at: portalRow.letzte_synchronisation_am,
        listing_url: portalRow.portal_listing_url,
      })
    }

    return result.sort((a, b) => {
      const orderA = PORTALS.find(p => p.slug === a.slug)?.reihenfolge ?? 999
      const orderB = PORTALS.find(p => p.slug === b.slug)?.reihenfolge ?? 999
      return orderA - orderB
    })
  } catch (e) {
    console.error('[portals] getPortalDataForListing failed:', e)
    return []
  }
}
