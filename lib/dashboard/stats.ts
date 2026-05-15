import { createClient } from '@/lib/supabase/server'

export interface NaechsterTermin {
  datum: string       // "2026-05-15"
  uhrzeit_von: string // "14:30"
}

export interface DashboardStatsData {
  aufrufe_7tage_summe: number
  anfragen_gesamt: number
  besichtigungen_geplant: number
  tage_online: number | null
  tage_verbleibend: number | null
  naechster_termin: NaechsterTermin | null
}

const PAKET_LAUFZEIT_TAGE = 180

export async function getDashboardStats(
  listingId: string,
  userId: string
): Promise<DashboardStatsData> {
  try {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    const [portalsRes, interessentenRes, termineRes, listingRes] = await Promise.all([
      supabase
        .from('listing_portals')
        .select('aufrufe_7tage')
        .eq('listing_id', listingId)
        .eq('user_id', userId),

      supabase
        .from('interessenten')
        .select('id', { count: 'exact', head: true })
        .eq('listing_id', listingId),

      supabase
        .from('termine')
        .select('datum, uhrzeit_von')
        .eq('listing_id', listingId)
        .eq('status', 'geplant')
        .gte('datum', today)
        .order('datum', { ascending: true })
        .order('uhrzeit_von', { ascending: true }),

      supabase
        .from('listings')
        .select('created_at, status')
        .eq('id', listingId)
        .eq('user_id', userId)
        .single(),
    ])

    const aufrufe_7tage_summe = (portalsRes.data ?? [])
      .reduce((sum, p) => sum + (p.aufrufe_7tage ?? 0), 0)

    const anfragen_gesamt = interessentenRes.count ?? 0

    const termine = termineRes.data ?? []
    const besichtigungen_geplant = termine.length
    const naechster_termin = termine[0]
      ? { datum: termine[0].datum, uhrzeit_von: termine[0].uhrzeit_von }
      : null

    let tage_online: number | null = null
    let tage_verbleibend: number | null = null

    if (listingRes.data?.status === 'aktiv' && listingRes.data.created_at) {
      const diffMs = Date.now() - new Date(listingRes.data.created_at).getTime()
      tage_online = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
      tage_verbleibend = Math.max(0, PAKET_LAUFZEIT_TAGE - tage_online)
    }

    return {
      aufrufe_7tage_summe,
      anfragen_gesamt,
      besichtigungen_geplant,
      tage_online,
      tage_verbleibend,
      naechster_termin,
    }
  } catch (e) {
    console.error('[dashboard-stats] getDashboardStats failed:', e)
    return {
      aufrufe_7tage_summe: 0,
      anfragen_gesamt: 0,
      besichtigungen_geplant: 0,
      tage_online: null,
      tage_verbleibend: null,
      naechster_termin: null,
    }
  }
}
