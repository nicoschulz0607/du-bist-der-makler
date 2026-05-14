import { createServiceClient } from '@/lib/supabase/service'
import { PORTALS, type PortalSlug } from './config'

const DEMO_DATA: Record<PortalSlug, { aufrufe_7tage: number; aufrufe_gesamt: number }> = {
  immoscout:          { aufrufe_7tage: 47, aufrufe_gesamt: 234 },
  immowelt:           { aufrufe_7tage: 31, aufrufe_gesamt: 156 },
  ebay_kleinanzeigen: { aufrufe_7tage: 12, aufrufe_gesamt: 58 },
}

/**
 * Erstellt für ein frisch veröffentlichtes Listing 3 Portal-Einträge mit Demo-Daten.
 * Niemals throw — Auto-Init darf User-Action nicht blockieren.
 */
export async function autoInitPortals(listingId: string, userId: string): Promise<void> {
  try {
    const supabase = createServiceClient()
    const now = new Date().toISOString()

    const rows = PORTALS.map(p => ({
      listing_id: listingId,
      user_id: userId,
      portal_slug: p.slug,
      status: 'aktiv' as const,
      aufrufe_7tage: DEMO_DATA[p.slug].aufrufe_7tage,
      aufrufe_gesamt: DEMO_DATA[p.slug].aufrufe_gesamt,
      aktiviert_am: now,
      letzte_synchronisation_am: now,
    }))

    const { error } = await supabase
      .from('listing_portals')
      .upsert(rows, { onConflict: 'listing_id,portal_slug', ignoreDuplicates: true })

    if (error) {
      console.error('[portals] auto-init failed:', error.message)
    }
  } catch (e) {
    console.error('[portals] auto-init unexpected error:', e)
  }
}
