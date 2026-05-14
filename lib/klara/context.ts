import { createClient } from '@/lib/supabase/server'
import { WIZARD_STATIONS } from '@/lib/wizard/config'
import { getPflichtDokumente } from '@/lib/dokumente/katalog'
import type { ActivityEvent } from '@/lib/activity/types'
import type { StationConfig } from '@/lib/wizard/config'
import type { ObjektTyp } from '@/lib/dokumente/katalog'

export interface KlaraContext {
  user: {
    id: string
    vorname: string | null
    paket_tier: 'basic' | 'pro' | 'premium' | null
    paket_aktiv_bis: string | null
    paket_tage_verbleibend: number | null
  }

  listing: {
    id: string
    objekttyp: string | null
    adresse_plz: string | null
    adresse_ort: string | null
    wohnflaeche_qm: number | null
    zimmer: number | null
    baujahr: number | null
    preis: number | null
    energieausweis_klasse: string | null
    energieausweis_status: string | null
    status: 'draft' | 'aktiv' | 'verkauft' | null
    tage_seit_anlage: number
    foto_anzahl: number
    hat_grundriss: boolean
    hat_expose: boolean
    hat_beschreibung: boolean
  } | null

  wizard: {
    aktuelle_station: number | null
    abgeschlossen_am: string | null
    aktive_station_config: StationConfig | null
  }

  interessenten: {
    gesamt: number
    nach_status: Record<string, number>
    aelteste_unbeantwortete_anfrage: {
      interessent_id: string
      name: string
      wartet_seit_stunden: number
    } | null
  }

  termine: {
    naechste: Array<{
      id: string
      datum: string
      uhrzeit: string
      dauer_min: number
      typ: string
      anzahl_interessenten: number
    }>
    naechster_in_stunden: number | null
  }

  unterlagen: {
    pflicht_gesamt: number
    pflicht_vorhanden: number
    pflicht_prozent: number
    aktive_mappen: number
  }

  checkliste: {
    aufgaben_erledigt: number
    aufgaben_gesamt: number
    prozent: number
  }

  aktivitaet: {
    letzte_events: ActivityEvent[]
    woche_zusammenfassung: string
    letzter_event_at: string | null
    tage_seit_letzter_aktivitaet: number | null
  }

  geladen_am: string
}

const UNBEANTWORTET_EXCLUDE = new Set(['abgesagt', 'kaufinteressent', 'verkauft'])

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}

function formatWochenZusammenfassung(
  events: ActivityEvent[],
  interessentenMap: Map<string, string>,
): string {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000)
  const weekEvents = events.filter((e) => new Date(e.created_at) >= sevenDaysAgo)

  const anfragenEvents = weekEvents.filter((e) => e.event_type === 'interessent_angelegt')
  const beantwortetEvents = weekEvents.filter((e) => e.event_type === 'interessent_status_geaendert')
  const n = anfragenEvents.length

  if (n === 0) {
    return 'Diese Woche kamen noch keine Anfragen — typisch in den ersten Tagen nach dem Live-Gang.'
  }

  if (n === 1) {
    const interessentId = anfragenEvents[0].interessent_id
    const vorname = interessentId ? (interessentenMap.get(interessentId)?.split(' ')[0] ?? null) : null
    if (vorname) return `Diese Woche hat sich ${vorname} gemeldet — gut!`
    return 'Diese Woche kam eine Anfrage rein — gut!'
  }

  const beantwortet = beantwortetEvents.length
  return `Diese Woche kamen ${n} Anfragen rein, ${beantwortet} davon hast du schon beantwortet.`
}

export async function getKlaraContext(userId: string): Promise<KlaraContext> {
  const now = new Date()

  const defaultUser: KlaraContext['user'] = {
    id: userId,
    vorname: null,
    paket_tier: null,
    paket_aktiv_bis: null,
    paket_tage_verbleibend: null,
  }

  let supabase: Awaited<ReturnType<typeof createClient>>
  try {
    supabase = await createClient()
  } catch {
    return {
      user: defaultUser,
      listing: null,
      wizard: { aktuelle_station: null, abgeschlossen_am: null, aktive_station_config: null },
      interessenten: { gesamt: 0, nach_status: {}, aelteste_unbeantwortete_anfrage: null },
      termine: { naechste: [], naechster_in_stunden: null },
      unterlagen: { pflicht_gesamt: 0, pflicht_vorhanden: 0, pflicht_prozent: 0, aktive_mappen: 0 },
      checkliste: { aufgaben_erledigt: 0, aufgaben_gesamt: 0, prozent: 0 },
      aktivitaet: { letzte_events: [], woche_zusammenfassung: 'Keine Aktivitätsdaten verfügbar.', letzter_event_at: null, tage_seit_letzter_aktivitaet: null },
      geladen_am: now.toISOString(),
    }
  }

  // ── Batch 1: Profile + Listing + Activity-Events ──────────────────────────
  const [profile, listing, allEvents] = await Promise.all([
    safe(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('vorname, paket_tier, paket_aktiv_bis')
        .eq('id', userId)
        .maybeSingle()
      return data
    }, null),

    safe(async () => {
      const { data } = await supabase
        .from('listings')
        .select(`
          id, objekttyp, adresse_plz, adresse_ort, wohnflaeche_qm, zimmer,
          baujahr, preis, energieausweis_klasse, energieausweis_status, status,
          fotos, expose_html, grundriss_url, beschreibung, created_at
        `)
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle()
      return data
    }, null),

    safe(async () => {
      const { data } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      return (data ?? []) as ActivityEvent[]
    }, [] as ActivityEvent[]),
  ])

  const listingId = listing?.id ?? null

  // ── Batch 2: Alles was listing.id braucht ────────────────────────────────
  const [interessentenRaw, termineRaw, dokumenteRaw, mappenCount, checklisteRaw, wizardData] = await Promise.all([
    safe(async () => {
      if (!listingId) return []
      const { data } = await supabase
        .from('interessenten')
        .select('id, name, status, created_at')
        .eq('listing_id', listingId)
      return (data ?? []) as Array<{ id: string; name: string; status: string; created_at: string }>
    }, [] as Array<{ id: string; name: string; status: string; created_at: string }>),

    safe(async () => {
      const heute = now.toISOString().split('T')[0]
      const { data } = await supabase
        .from('termine')
        .select('id, datum, uhrzeit, dauer_min, typ, anzahl_interessenten')
        .gte('datum', heute)
        .order('datum', { ascending: true })
        .order('uhrzeit', { ascending: true })
        .limit(3)
      return (data ?? []) as Array<{ id: string; datum: string; uhrzeit: string; dauer_min: number; typ: string; anzahl_interessenten: number }>
    }, [] as Array<{ id: string; datum: string; uhrzeit: string; dauer_min: number; typ: string; anzahl_interessenten: number }>),

    safe(async () => {
      const { data } = await supabase
        .from('dokumente')
        .select('dokument_typ, status')
        .eq('user_id', userId)
      return (data ?? []) as Array<{ dokument_typ: string; status: string }>
    }, [] as Array<{ dokument_typ: string; status: string }>),

    safe(async () => {
      const { data } = await supabase
        .from('dokument_shares')
        .select('id')
        .eq('user_id', userId)
        .is('zurueckgezogen_am', null)
      return (data ?? []).length
    }, 0),

    safe(async () => {
      const { data } = await supabase
        .from('checkliste_status')
        .select('completed')
        .eq('user_id', userId)
      return (data ?? []) as Array<{ completed: boolean }>
    }, [] as Array<{ completed: boolean }>),

    safe(async () => {
      const { data } = await supabase
        .from('wizard_progress')
        .select('aktuelle_station')
        .eq('user_id', userId)
        .maybeSingle()
      return data
    }, null),
  ])

  // ── User ─────────────────────────────────────────────────────────────────
  let paket_tage_verbleibend: number | null = null
  if (profile?.paket_aktiv_bis) {
    paket_tage_verbleibend = Math.max(
      0,
      Math.ceil((new Date(profile.paket_aktiv_bis).getTime() - now.getTime()) / 86400000),
    )
  }

  const userSection: KlaraContext['user'] = {
    id: userId,
    vorname: profile?.vorname ?? null,
    paket_tier: (profile?.paket_tier as KlaraContext['user']['paket_tier']) ?? null,
    paket_aktiv_bis: profile?.paket_aktiv_bis ?? null,
    paket_tage_verbleibend,
  }

  // ── Listing ───────────────────────────────────────────────────────────────
  let listingSection: KlaraContext['listing'] = null
  if (listing) {
    const fotoCount = Array.isArray(listing.fotos) ? (listing.fotos as unknown[]).length : 0
    const daysSince = listing.created_at
      ? Math.floor((now.getTime() - new Date(listing.created_at).getTime()) / 86400000)
      : 0
    listingSection = {
      id: listing.id,
      objekttyp: listing.objekttyp ?? null,
      adresse_plz: listing.adresse_plz ?? null,
      adresse_ort: listing.adresse_ort ?? null,
      wohnflaeche_qm: listing.wohnflaeche_qm ?? null,
      zimmer: listing.zimmer ?? null,
      baujahr: listing.baujahr ?? null,
      preis: listing.preis ?? null,
      energieausweis_klasse: listing.energieausweis_klasse ?? null,
      energieausweis_status: listing.energieausweis_status ?? null,
      status: (listing.status as 'draft' | 'aktiv' | 'verkauft') ?? null,
      tage_seit_anlage: daysSince,
      foto_anzahl: fotoCount,
      hat_grundriss: !!listing.grundriss_url,
      hat_expose: !!listing.expose_html,
      hat_beschreibung: !!listing.beschreibung,
    }
  }

  // ── Wizard ───────────────────────────────────────────────────────────────
  const aktuelleStation = wizardData?.aktuelle_station ?? null
  const aktiveStationConfig = aktuelleStation
    ? (WIZARD_STATIONS.find((s) => s.stationNum === aktuelleStation) ?? null)
    : null
  const wizardSection: KlaraContext['wizard'] = {
    aktuelle_station: aktuelleStation,
    abgeschlossen_am: null,
    aktive_station_config: aktiveStationConfig,
  }

  // ── Interessenten ────────────────────────────────────────────────────────
  const nachStatus: Record<string, number> = {}
  for (const i of interessentenRaw) {
    nachStatus[i.status] = (nachStatus[i.status] ?? 0) + 1
  }

  const unbeantwortete = interessentenRaw
    .filter((i) => !UNBEANTWORTET_EXCLUDE.has(i.status))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const aelteste = unbeantwortete[0] ?? null
  const aelteste_unbeantwortete = aelteste
    ? {
        interessent_id: aelteste.id,
        name: aelteste.name,
        wartet_seit_stunden: Math.ceil(
          (now.getTime() - new Date(aelteste.created_at).getTime()) / 3600000,
        ),
      }
    : null

  // ── Termine ──────────────────────────────────────────────────────────────
  let naechster_in_stunden: number | null = null
  if (termineRaw[0]) {
    const t = termineRaw[0]
    const terminDt = new Date(`${t.datum}T${t.uhrzeit ?? '00:00'}`)
    naechster_in_stunden = Math.ceil((terminDt.getTime() - now.getTime()) / 3600000)
  }

  // ── Unterlagen ───────────────────────────────────────────────────────────
  const objekttyp = (listing?.objekttyp as ObjektTyp | null) ?? null
  const pflichtKatalog = getPflichtDokumente(objekttyp, false)
  const dbByTyp = new Map(dokumenteRaw.map((d) => [d.dokument_typ, d]))
  const pflicht_gesamt = pflichtKatalog.length
  const pflicht_vorhanden = pflichtKatalog.filter(
    (d) => dbByTyp.get(d.typ)?.status === 'vorhanden',
  ).length
  const pflicht_prozent = pflicht_gesamt > 0 ? Math.round((pflicht_vorhanden / pflicht_gesamt) * 100) : 0

  // ── Checkliste ───────────────────────────────────────────────────────────
  const aufgaben_erledigt = checklisteRaw.filter((c) => c.completed).length
  const aufgaben_gesamt = checklisteRaw.length
  const checkliste_prozent = aufgaben_gesamt > 0 ? Math.round((aufgaben_erledigt / aufgaben_gesamt) * 100) : 0

  // ── Aktivität ────────────────────────────────────────────────────────────
  const interessentenMap = new Map(interessentenRaw.map((i) => [i.id, i.name]))
  const woche_zusammenfassung = formatWochenZusammenfassung(allEvents, interessentenMap)
  const letzter_event_at = allEvents[0]?.created_at ?? null
  const tage_seit_letzter_aktivitaet = letzter_event_at
    ? Math.floor((now.getTime() - new Date(letzter_event_at).getTime()) / 86400000)
    : null

  return {
    user: userSection,
    listing: listingSection,
    wizard: wizardSection,
    interessenten: {
      gesamt: interessentenRaw.length,
      nach_status: nachStatus,
      aelteste_unbeantwortete_anfrage: aelteste_unbeantwortete,
    },
    termine: {
      naechste: termineRaw,
      naechster_in_stunden,
    },
    unterlagen: {
      pflicht_gesamt,
      pflicht_vorhanden,
      pflicht_prozent,
      aktive_mappen: mappenCount,
    },
    checkliste: {
      aufgaben_erledigt,
      aufgaben_gesamt,
      prozent: checkliste_prozent,
    },
    aktivitaet: {
      letzte_events: allEvents.slice(0, 3),
      woche_zusammenfassung,
      letzter_event_at,
      tage_seit_letzter_aktivitaet,
    },
    geladen_am: now.toISOString(),
  }
}
