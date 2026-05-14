'use server'

import { createClient } from '@/lib/supabase/server'
import type { StationStatusEntry, StationStatusMap, WizardProfile } from './types'
import { getActiveProvider } from './market-data-provider'
import type { MarktwertDaten, LageDaten } from './market-data-provider'
import { generiereExpose } from '@/lib/claude/expose'
import type { ExposeOutput } from '@/lib/claude/expose'

export async function upsertWizardProgress(): Promise<{
  aktuelle_station: number
  station_status: StationStatusMap
  wizard_profile: WizardProfile
} | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: existing } = await supabase
    .from('wizard_progress')
    .select('aktuelle_station, station_status, wizard_profile')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return existing

  const { data } = await supabase
    .from('wizard_progress')
    .insert({ user_id: user.id })
    .select('aktuelle_station, station_status, wizard_profile')
    .single()

  return data
}

export async function advanceStation(station: number): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('wizard_progress')
    .update({
      aktuelle_station: station,
      zuletzt_aktiv_am: new Date().toISOString(),
    })
    .eq('user_id', user.id)
}

export async function skipStation(stationNum: number, reason?: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: existing } = await supabase
    .from('wizard_progress')
    .select('station_status')
    .eq('user_id', user.id)
    .maybeSingle()

  const statusMap: StationStatusMap = (existing?.station_status ?? {}) as StationStatusMap
  const entry: StationStatusEntry = {
    status: 'skipped',
    ...(reason ? { skip_reason: reason } : {}),
  }

  await supabase
    .from('wizard_progress')
    .update({
      station_status: { ...statusMap, [stationNum]: entry },
      aktuelle_station: Math.min(stationNum + 1, 9),
      zuletzt_aktiv_am: new Date().toISOString(),
    })
    .eq('user_id', user.id)
}

export async function markStationComplete(stationNum: number): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: existing } = await supabase
    .from('wizard_progress')
    .select('station_status')
    .eq('user_id', user.id)
    .maybeSingle()

  const statusMap: StationStatusMap = (existing?.station_status ?? {}) as StationStatusMap

  await supabase
    .from('wizard_progress')
    .update({
      station_status: { ...statusMap, [stationNum]: { status: 'completed' } },
      zuletzt_aktiv_am: new Date().toISOString(),
    })
    .eq('user_id', user.id)
}

export async function saveWizardProfile(data: Partial<WizardProfile>): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: existing } = await supabase
    .from('wizard_progress')
    .select('wizard_profile')
    .eq('user_id', user.id)
    .maybeSingle()

  const current = (existing?.wizard_profile ?? {}) as WizardProfile

  await supabase
    .from('wizard_progress')
    .update({
      wizard_profile: { ...current, ...data },
      zuletzt_aktiv_am: new Date().toISOString(),
    })
    .eq('user_id', user.id)
}

export async function saveStation2Profile(data: {
  vorname?: string
  nachname?: string
  telefon?: string
  anschrift?: string
}): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const updates: Record<string, string> = {}
  if (data.vorname !== undefined) updates.vorname = data.vorname
  if (data.nachname !== undefined) updates.nachname = data.nachname
  if (data.telefon !== undefined) updates.telefon = data.telefon
  if (data.anschrift !== undefined) updates.anschrift = data.anschrift

  if (Object.keys(updates).length === 0) return

  await supabase.from('profiles').update(updates).eq('id', user.id)
}

export async function saveStation3Listing(data: {
  objekttyp?: string
  adresse_strasse?: string
  adresse_plz?: string
  adresse_ort?: string
  wohnflaeche_qm?: number | null
  zimmer?: number | null
  baujahr?: number | null
}): Promise<{ listingId: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { listingId: null }

  const { data: existing } = await supabase
    .from('listings')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  )

  if (existing) {
    await supabase.from('listings').update(cleanData).eq('id', existing.id)
    return { listingId: existing.id }
  } else {
    const { data: newListing } = await supabase
      .from('listings')
      .insert({ user_id: user.id, status: 'draft', ...cleanData })
      .select('id')
      .single()
    return { listingId: newListing?.id ?? null }
  }
}

export async function dismissOnboarding(answer: boolean): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('profiles')
    .update({ wizard_onboarding_shown: true, wizard_onboarding_answer: answer })
    .eq('id', user.id)
}

export async function dismissReentryBanner(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: existing } = await supabase
    .from('profiles')
    .select('wizard_banner_dismissals')
    .eq('id', user.id)
    .single()

  await supabase
    .from('profiles')
    .update({ wizard_banner_dismissals: (existing?.wizard_banner_dismissals ?? 0) + 1 })
    .eq('id', user.id)
}

export async function analyseStarten(listingId: string): Promise<{
  success: boolean
  marktwert?: MarktwertDaten
  lage?: LageDaten
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: listing } = await supabase
    .from('listings')
    .select('id, user_id')
    .eq('id', listingId)
    .eq('user_id', user.id)
    .single()

  if (!listing) return { success: false, error: 'Listing nicht gefunden' }

  const provider = getActiveProvider()
  const result = await provider.analysiereImmobilie(listingId)

  if (!result) return { success: false, error: 'Analyse fehlgeschlagen — bitte später erneut versuchen.' }

  return { success: true, marktwert: result.marktwert, lage: result.lage }
}

export async function setAdresseImExpose(listingId: string, value: boolean): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('listings')
    .update({ adresse_im_expose: value })
    .eq('id', listingId)
    .eq('user_id', user.id)
}

export async function saveEnergiausweis(
  listingId: string,
  data: {
    status: string
    klasse?: string | null
    typ?: string | null
    verbrauch?: number | null
    dateiUrl?: string | null
  }
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const updates: Record<string, unknown> = { energieausweis_status: data.status }
  if (data.klasse !== undefined) updates.energieausweis_klasse = data.klasse
  if (data.typ !== undefined) updates.energieausweis_typ = data.typ
  if (data.verbrauch !== undefined) updates.energieverbrauch = data.verbrauch
  if (data.dateiUrl !== undefined) updates.energieausweis_datei_url = data.dateiUrl

  await supabase.from('listings').update(updates).eq('id', listingId).eq('user_id', user.id)
}

export async function saveGrundriss(
  listingId: string,
  data: { status: string; url?: string | null }
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const updates: Record<string, unknown> = { grundriss_status: data.status }
  if (data.url !== undefined) updates.grundriss_url = data.url

  await supabase.from('listings').update(updates).eq('id', listingId).eq('user_id', user.id)
}

export async function saveAusstattung(
  listingId: string,
  data: { items: string[]; beschreibung?: string | null }
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const updates: Record<string, unknown> = { ausstattung_items: data.items }
  if (data.beschreibung !== undefined) updates.beschreibung = data.beschreibung

  await supabase.from('listings').update(updates).eq('id', listingId).eq('user_id', user.id)
}

export async function generiereInseratTexte(listingId: string): Promise<{
  success: boolean
  expose?: ExposeOutput
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nicht eingeloggt' }

  const { data: listing } = await supabase
    .from('listings')
    .select('id, objekttyp, adresse_strasse, adresse_plz, adresse_ort, wohnflaeche_qm, zimmer, baujahr, zustand, preis, energieausweis_klasse, beschreibung')
    .eq('id', listingId)
    .eq('user_id', user.id)
    .single()

  if (!listing) return { success: false, error: 'Listing nicht gefunden' }

  try {
    const expose = await generiereExpose({
      objekttyp: listing.objekttyp ?? null,
      adresse_strasse: listing.adresse_strasse ?? null,
      adresse_plz: listing.adresse_plz ?? null,
      adresse_ort: listing.adresse_ort ?? null,
      wohnflaeche_qm: listing.wohnflaeche_qm ?? null,
      zimmer: listing.zimmer ?? null,
      baujahr: listing.baujahr ?? null,
      zustand: listing.zustand ?? null,
      preis: listing.preis ?? null,
      energieausweis_klasse: listing.energieausweis_klasse ?? null,
      beschreibung: listing.beschreibung ?? null,
      wasIstBesonders: '',
      idealeKaeufer: '',
    })

    await supabase
      .from('listings')
      .update({
        expose_html: JSON.stringify(expose),
        expose_generiert_at: new Date().toISOString(),
        expose_edits: null,
      })
      .eq('id', listingId)

    return { success: true, expose }
  } catch (err) {
    console.error('[generiereInseratTexte]', err)
    return { success: false, error: 'KI-Generierung fehlgeschlagen — bitte erneut versuchen.' }
  }
}

export async function saveExposeEdits(
  listingId: string,
  edits: Partial<ExposeOutput>
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: existing } = await supabase
    .from('listings')
    .select('expose_edits')
    .eq('id', listingId)
    .eq('user_id', user.id)
    .single()

  const current = (existing?.expose_edits ?? {}) as Record<string, unknown>

  await supabase
    .from('listings')
    .update({ expose_edits: { ...current, ...edits } })
    .eq('id', listingId)
    .eq('user_id', user.id)
}

export async function veroeffentlicheListing(
  listingId: string
): Promise<{ success: boolean; slug?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listing } = await supabase
    .from('listings')
    .select('id, adresse_ort')
    .eq('id', listingId)
    .eq('user_id', user.id)
    .single()

  if (!listing) return { success: false }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ort = (listing as any).adresse_ort as string | null
  const slug = generateSlug(listing.id, ort)

  await supabase
    .from('listings')
    .update({
      status: 'aktiv',
      veroeffentlicht_am: new Date().toISOString(),
      slug,
      portal_status: {
        eigene_seite: { status: 'live', live_seit: new Date().toISOString() },
        immoscout: { status: 'pending_demo', hinweis: 'Demo-Modus — manuelle Übermittlung in Vorbereitung' },
        ebay: { status: 'pending_demo', hinweis: 'Demo-Modus' },
      },
    })
    .eq('id', listingId)
    .eq('user_id', user.id)

  const { data: progress } = await supabase
    .from('wizard_progress')
    .select('station_status')
    .eq('user_id', user.id)
    .single()

  await supabase
    .from('wizard_progress')
    .update({
      station_status: { ...(progress?.station_status ?? {}), 9: { status: 'completed' } },
      zuletzt_aktiv_am: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  return { success: true, slug }
}

function generateSlug(id: string, ort: string | null): string {
  const ortClean = (ort ?? 'objekt').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30)
  return `${ortClean}-${id.slice(0, 8)}`
}
