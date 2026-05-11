import { unstable_cache } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

export type HeliosListingStatus = 'draft' | 'aktiv' | 'verkauft'

export interface HeliosListing {
  id: string
  userId: string
  status: HeliosListingStatus
  objekttyp: string | null
  adresseOrt: string | null
  preis: number | null
  createdAt: string      // ISO string — unstable_cache serialisiert Date zu string
  updatedAt: string
  userEmail: string | null
  paketTier: 'basic' | 'pro' | 'premium' | null
  immoscoutStatus: string | null
  verkaufAm: string | null  // ISO string
}

export interface HeliosKunde {
  id: string
  email: string | null
  vorname: string | null
  paketTier: 'basic' | 'pro' | 'premium' | null
  paketAktivBis: string | null  // ISO string
  createdAt: string
  listingCount: number
}

export interface HeliosPaket {
  id: string
  typ: 'paket' | 'reaktivierung' | 'addon'
  tier: string | null
  addonType: string | null
  laufzeitMonate: number | null
  startDatum: string        // ISO string
  endeDatum: string         // ISO string
  status: 'aktiv' | 'abgelaufen' | 'storniert' | 'refunded'
  betragCent: number
  waehrung: string
  stripePaymentIntentId: string | null
  angerechneterBetrag: number | null
}

export interface HeliosKundeDetail extends HeliosKunde {
  paketHistory: HeliosPaket[]
  listings: HeliosListing[]
}

export const fetchAlleListings = unstable_cache(
  async (): Promise<HeliosListing[]> => {
    const service = createServiceClient()

    const { data: listings } = await service
      .from('listings')
      .select('id, user_id, status, objekttyp, adresse_ort, preis, created_at, updated_at, immoscout_status, verkauft_am')
      .order('created_at', { ascending: false })
      .limit(200)

    if (!listings || listings.length === 0) return []

    const userIds = [...new Set(listings.map((l) => l.user_id as string))]
    const { data: profiles } = await service
      .from('profiles')
      .select('id, email, paket_tier')
      .in('id', userIds)

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

    return listings.map((l) => {
      const profile = profileMap.get(l.user_id)
      return {
        id: l.id,
        userId: l.user_id,
        status: (l.status ?? 'draft') as HeliosListingStatus,
        objekttyp: l.objekttyp ?? null,
        adresseOrt: l.adresse_ort ?? null,
        preis: l.preis ?? null,
        createdAt: l.created_at,
        updatedAt: l.updated_at,
        userEmail: profile?.email ?? null,
        paketTier: (profile?.paket_tier ?? null) as HeliosKunde['paketTier'],
        immoscoutStatus: (l as Record<string, unknown>).immoscout_status as string | null ?? null,
        verkaufAm: (l as Record<string, unknown>).verkauft_am as string | null ?? null,
      }
    })
  },
  ['helios-alle-listings'],
  { revalidate: 300 }
)

export const fetchAktiveListings = unstable_cache(
  async (): Promise<HeliosListing[]> => {
    const all = await fetchAlleListings()
    return all.filter((l) => l.status === 'aktiv')
  },
  ['helios-aktive-listings'],
  { revalidate: 300 }
)

export const fetchListingsOhneAktivitaet = unstable_cache(
  async (tage = 14): Promise<HeliosListing[]> => {
    const cutoffIso = new Date(Date.now() - tage * 24 * 60 * 60 * 1000).toISOString()
    const all = await fetchAlleListings()
    return all.filter((l) => l.status === 'aktiv' && l.updatedAt < cutoffIso)
  },
  ['helios-inaktive-listings'],
  { revalidate: 300 }
)

export const fetchAlleKunden = unstable_cache(
  async (): Promise<HeliosKunde[]> => {
    const service = createServiceClient()

    const { data: profiles } = await service
      .from('profiles')
      .select('id, email, vorname, paket_tier, paket_aktiv_bis, created_at')
      .not('paket_tier', 'is', null)
      .order('created_at', { ascending: false })

    if (!profiles || profiles.length === 0) return []

    const userIds = profiles.map((p) => p.id as string)
    const { data: listings } = await service
      .from('listings')
      .select('user_id')
      .in('user_id', userIds)

    const listingCountMap = new Map<string, number>()
    for (const l of listings ?? []) {
      listingCountMap.set(l.user_id, (listingCountMap.get(l.user_id) ?? 0) + 1)
    }

    return profiles.map((p) => ({
      id: p.id,
      email: p.email ?? null,
      vorname: p.vorname ?? null,
      paketTier: (p.paket_tier ?? null) as HeliosKunde['paketTier'],
      paketAktivBis: p.paket_aktiv_bis ?? null,
      createdAt: p.created_at,
      listingCount: listingCountMap.get(p.id) ?? 0,
    }))
  },
  ['helios-alle-kunden'],
  { revalidate: 300 }
)

export const fetchKundeDetails = (userId: string) =>
  unstable_cache(
    async (): Promise<HeliosKundeDetail | null> => {
      const service = createServiceClient()

      const { data: profile } = await service
        .from('profiles')
        .select('id, email, vorname, paket_tier, paket_aktiv_bis, created_at')
        .eq('id', userId)
        .maybeSingle()

      if (!profile) return null

      const [{ data: pakete }, { data: listings }] = await Promise.all([
        service
          .from('pakete')
          .select('id, typ, tier, addon_type, laufzeit_monate, start_datum, ende_datum, status, betrag_cent, waehrung, stripe_payment_intent_id, angerechneter_betrag')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        service
          .from('listings')
          .select('id, user_id, status, objekttyp, adresse_ort, preis, created_at, updated_at, immoscout_status, verkauft_am')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      ])

      const paketHistory: HeliosPaket[] = (pakete ?? []).map((p) => ({
        id: p.id,
        typ: p.typ as HeliosPaket['typ'],
        tier: p.tier ?? null,
        addonType: p.addon_type ?? null,
        laufzeitMonate: p.laufzeit_monate ?? null,
        startDatum: p.start_datum,
        endeDatum: p.ende_datum,
        status: p.status as HeliosPaket['status'],
        betragCent: p.betrag_cent,
        waehrung: p.waehrung ?? 'eur',
        stripePaymentIntentId: p.stripe_payment_intent_id ?? null,
        angerechneterBetrag: p.angerechneter_betrag ?? null,
      }))

      const kundeListings: HeliosListing[] = (listings ?? []).map((l) => ({
        id: l.id,
        userId: l.user_id,
        status: (l.status ?? 'draft') as HeliosListingStatus,
        objekttyp: l.objekttyp ?? null,
        adresseOrt: l.adresse_ort ?? null,
        preis: l.preis ?? null,
        createdAt: l.created_at,
        updatedAt: l.updated_at,
        userEmail: profile.email ?? null,
        paketTier: (profile.paket_tier ?? null) as HeliosKunde['paketTier'],
        immoscoutStatus: (l as Record<string, unknown>).immoscout_status as string | null ?? null,
        verkaufAm: (l as Record<string, unknown>).verkauft_am as string | null ?? null,
      }))

      const listingCount = kundeListings.length

      return {
        id: profile.id,
        email: profile.email ?? null,
        vorname: profile.vorname ?? null,
        paketTier: (profile.paket_tier ?? null) as HeliosKunde['paketTier'],
        paketAktivBis: profile.paket_aktiv_bis ?? null,
        createdAt: profile.created_at,
        listingCount,
        paketHistory,
        listings: kundeListings,
      }
    },
    ['helios-kunde-detail', userId],
    { revalidate: 60 }
  )()

export const fetchListingDetails = (listingId: string) =>
  unstable_cache(
    async (): Promise<(HeliosListing & { userVorname: string | null }) | null> => {
      const service = createServiceClient()

      const { data: listing } = await service
        .from('listings')
        .select('id, user_id, status, objekttyp, adresse_ort, preis, created_at, updated_at, immoscout_status, verkauft_am')
        .eq('id', listingId)
        .maybeSingle()

      if (!listing) return null

      const { data: profile } = await service
        .from('profiles')
        .select('id, email, vorname, paket_tier')
        .eq('id', listing.user_id)
        .maybeSingle()

      return {
        id: listing.id,
        userId: listing.user_id,
        status: (listing.status ?? 'draft') as HeliosListingStatus,
        objekttyp: listing.objekttyp ?? null,
        adresseOrt: listing.adresse_ort ?? null,
        preis: listing.preis ?? null,
        createdAt: listing.created_at,
        updatedAt: listing.updated_at,
        userEmail: profile?.email ?? null,
        paketTier: (profile?.paket_tier ?? null) as HeliosKunde['paketTier'],
        immoscoutStatus: (listing as Record<string, unknown>).immoscout_status as string | null ?? null,
        verkaufAm: (listing as Record<string, unknown>).verkauft_am as string | null ?? null,
        userVorname: profile?.vorname ?? null,
      }
    },
    ['helios-listing-detail', listingId],
    { revalidate: 60 }
  )()

// ── Verkäufe ──────────────────────────────────────────────────────────────────

export const fetchVerkaufteListings = (zeitraum: { von: string; bis: string }) =>
  unstable_cache(
    async (): Promise<HeliosListing[]> => {
      const service = createServiceClient()

      const { data: listings } = await service
        .from('listings')
        .select('id, user_id, status, objekttyp, adresse_ort, preis, created_at, updated_at, immoscout_status, verkauft_am')
        .eq('status', 'verkauft')
        .not('verkauft_am', 'is', null)
        .gte('verkauft_am', zeitraum.von)
        .lte('verkauft_am', zeitraum.bis)
        .order('verkauft_am', { ascending: false })
        .limit(200)

      if (!listings || listings.length === 0) return []

      const userIds = [...new Set(listings.map((l) => l.user_id as string))]
      const { data: profiles } = await service
        .from('profiles')
        .select('id, email, paket_tier')
        .in('id', userIds)

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

      return listings.map((l) => {
        const profile = profileMap.get(l.user_id)
        return {
          id: l.id,
          userId: l.user_id,
          status: 'verkauft' as HeliosListingStatus,
          objekttyp: l.objekttyp ?? null,
          adresseOrt: l.adresse_ort ?? null,
          preis: l.preis ?? null,
          createdAt: l.created_at,
          updatedAt: l.updated_at,
          userEmail: profile?.email ?? null,
          paketTier: (profile?.paket_tier ?? null) as HeliosKunde['paketTier'],
          immoscoutStatus: (l as Record<string, unknown>).immoscout_status as string | null ?? null,
          verkaufAm: (l as Record<string, unknown>).verkauft_am as string | null ?? null,
        }
      })
    },
    ['helios-verkaufte-listings', zeitraum.von, zeitraum.bis],
    { revalidate: 300 }
  )()

// ── Operations: bevorstehende Makler-Beratungen ───────────────────────────────

export interface HeliosMaklerTermin {
  id: string
  thema: string
  bestaetigterTermin: string
  userEmail: string | null
  tier: string | null
}

export const fetchUpcomingMaklerTermine = unstable_cache(
  async (tage = 7): Promise<HeliosMaklerTermin[]> => {
    try {
      const service = createServiceClient()
      const von = new Date().toISOString()
      const bis = new Date(Date.now() + tage * 86400_000).toISOString()

      // Column 'bestätigter_termin' uses umlaut as stored by the bestätigen route
      const { data } = await service
        .from('makler_anfragen')
        .select('id, thema, user_id, status')
        .eq('status', 'bestätigt')
        .limit(20)

      if (!data || data.length === 0) return []

      // Filter upcoming in JS because umlaut column filtering via PostgREST is unreliable
      const { data: full } = await service
        .from('makler_anfragen')
        .select('id, thema, user_id')
        .eq('status', 'bestätigt')
        .limit(50)

      // Fetch full rows to access bestätigter_termin
      const rows = (full ?? []) as Array<Record<string, unknown>>
      const upcoming = rows.filter((r) => {
        const t = r['bestätigter_termin'] as string | null
        return t != null && t >= von && t <= bis
      })

      if (upcoming.length === 0) return []

      const userIds = [...new Set(upcoming.map((r) => r.user_id as string))]
      const { data: profiles } = await service
        .from('profiles')
        .select('id, email, paket_tier')
        .in('id', userIds)

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

      return upcoming.map((r) => {
        const p = profileMap.get(r.user_id as string)
        return {
          id: r.id as string,
          thema: r.thema as string,
          bestaetigterTermin: r['bestätigter_termin'] as string,
          userEmail: p?.email ?? null,
          tier: p?.paket_tier ?? null,
        }
      })
    } catch {
      return []
    }
  },
  ['helios-upcoming-makler-termine'],
  { revalidate: 120 }
)

// ── Anfragen-Volumen: Makler-Anfragen Status-Counts ──────────────────────────
// Kein SLA-%-Tracking möglich ohne makler_anfragen.bestaetigt_am — kommt Sprint 5.
// Diese Funktion liefert Volumen + Überfällige (>24h offen) — beides direkt messbar.

export interface AnfragenVolumenDaten {
  total: number
  bestaetigt: number
  offen: number        // 'neu' AND created < 24h ago — in progress
  ueberfaellig: number // 'neu' AND created >= 24h ago — überfällig
  verlauf: Array<{ datum: string; anzahl: number }>
}

export const fetchAnfragenVolumen = unstable_cache(
  async (tage = 30): Promise<AnfragenVolumenDaten> => {
    try {
      const service = createServiceClient()
      const von = new Date(Date.now() - tage * 86400_000).toISOString()
      const cutoff24h = new Date(Date.now() - 86400_000).toISOString()

      const { data } = await service
        .from('makler_anfragen')
        .select('id, status, created_at')
        .gte('created_at', von)
        .order('created_at', { ascending: true })

      const rows = (data ?? []) as Array<{ id: string; status: string; created_at: string }>

      let bestaetigt = 0, offen = 0, ueberfaellig = 0

      for (const r of rows) {
        if (r.status === 'bestätigt') {
          bestaetigt++
        } else if (r.status === 'neu') {
          if (r.created_at < cutoff24h) {
            ueberfaellig++
          } else {
            offen++
          }
        }
      }

      const byDay = new Map<string, number>()
      for (const r of rows) {
        const datum = r.created_at.slice(0, 10)
        byDay.set(datum, (byDay.get(datum) ?? 0) + 1)
      }

      const verlauf = Array.from(byDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([datum, anzahl]) => ({ datum, anzahl }))

      return { total: rows.length, bestaetigt, offen, ueberfaellig, verlauf }
    } catch {
      return { total: 0, bestaetigt: 0, offen: 0, ueberfaellig: 0, verlauf: [] }
    }
  },
  ['helios-anfragen-volumen'],
  { revalidate: 300 }
)

export const fetchLetzteBusinessEvents = unstable_cache(
  async (limit = 20): Promise<Array<{ id: string; eventName: string; userId: string | null; properties: Record<string, unknown>; createdAt: string }>> => {
    const service = createServiceClient()
    const { data } = await service
      .from('business_events')
      .select('id, event_name, user_id, properties, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    return (data ?? []).map((e) => ({
      id: e.id,
      eventName: e.event_name,
      userId: e.user_id ?? null,
      properties: (e.properties ?? {}) as Record<string, unknown>,
      createdAt: e.created_at,
    }))
  },
  ['helios-letzte-events'],
  { revalidate: 60 }
)
