import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WizardShell from '@/components/wizard/WizardShell'
import type { StationStatusMap, WizardProfile } from '@/lib/wizard/types'
import type { MarktwertDaten, LageDaten } from '@/lib/wizard/market-data-provider'
import type { FotoItem } from '@/lib/foto'
import type { Tier } from '@/lib/tier'

export const metadata = { title: 'Geführter Modus — Dashboard' }

export default async function WizardStartPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [progressResult, listingResult, profileResult] = await Promise.all([
    supabase
      .from('wizard_progress')
      .select('aktuelle_station, station_status, wizard_profile')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('listings')
      .select('id, objekttyp, adresse_strasse, adresse_plz, adresse_ort, wohnflaeche_qm, zimmer, baujahr, preis, marktwert_daten, lage_daten, adresse_im_expose, fotos, energieausweis_status, energieausweis_datei_url, energieausweis_klasse, energieausweis_typ, energieverbrauch, grundriss_status, grundriss_url, ausstattung_items, beschreibung, expose_html, expose_edits')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('vorname, nachname, telefon, anschrift, paket_tier')
      .eq('id', user.id)
      .single(),
  ])

  if (!progressResult.data) {
    await supabase.from('wizard_progress').insert({ user_id: user.id })
  }

  const station = Math.max(1, Math.min(9, progressResult.data?.aktuelle_station ?? 1))
  const stationStatus = (progressResult.data?.station_status ?? {}) as StationStatusMap
  const wizardProfile = (progressResult.data?.wizard_profile ?? {}) as WizardProfile

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (profileResult.data ?? {}) as any
  const profileData = {
    vorname: raw.vorname ?? null,
    nachname: raw.nachname ?? null,
    telefon: raw.telefon ?? null,
    anschrift: raw.anschrift ?? null,
  }
  const userTier = (raw.paket_tier ?? null) as Tier

  const initialListingData = listingResult.data
    ? {
        objekttyp: listingResult.data.objekttyp ?? null,
        adresse_strasse: listingResult.data.adresse_strasse ?? null,
        adresse_plz: listingResult.data.adresse_plz ?? null,
        adresse_ort: listingResult.data.adresse_ort ?? null,
        wohnflaeche_qm: listingResult.data.wohnflaeche_qm ?? null,
        zimmer: listingResult.data.zimmer ?? null,
        baujahr: listingResult.data.baujahr ?? null,
        preis: (listingResult.data as any).preis ?? null,
      }
    : null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lr = (listingResult.data ?? {}) as any

  let exposeTitle: string | null = null
  let exposeKurz: string | null = null
  try {
    if (lr.expose_html) {
      const parsed = JSON.parse(lr.expose_html) as { titel?: string; beschreibung_kurz?: string }
      exposeTitle = parsed.titel ?? null
      exposeKurz = parsed.beschreibung_kurz ?? null
    }
  } catch { /* ignore */ }
  const edits = (lr.expose_edits ?? {}) as { titel?: string; beschreibung_kurz?: string }
  if (edits.titel) exposeTitle = edits.titel
  if (edits.beschreibung_kurz) exposeKurz = edits.beschreibung_kurz

  return (
    <WizardShell
      initialStation={station}
      stationStatus={stationStatus}
      listingId={listingResult.data?.id ?? null}
      wizardProfile={wizardProfile}
      profileData={profileData}
      userEmail={user.email ?? ''}
      userId={user.id}
      userTier={userTier}
      initialListingData={initialListingData}
      initialMarktwert={(lr.marktwert_daten ?? null) as MarktwertDaten | null}
      initialLage={(lr.lage_daten ?? null) as LageDaten | null}
      initialAdresseImExpose={(lr.adresse_im_expose ?? false) as boolean}
      initialFotos={(lr.fotos ?? []) as FotoItem[]}
      initialEnergieStatus={(lr.energieausweis_status ?? null) as string | null}
      initialEnergieKlasse={(lr.energieausweis_klasse ?? null) as string | null}
      initialEnergieTyp={(lr.energieausweis_typ ?? null) as string | null}
      initialEnergieVerbrauch={(lr.energieverbrauch ?? null) as number | null}
      initialEnergieDateiUrl={(lr.energieausweis_datei_url ?? null) as string | null}
      initialGrundrissStatus={(lr.grundriss_status ?? null) as string | null}
      initialGrundrissUrl={(lr.grundriss_url ?? null) as string | null}
      initialAusstattungItems={(lr.ausstattung_items ?? []) as string[]}
      initialBeschreibung={(lr.beschreibung ?? null) as string | null}
      initialExposeHtml={(lr.expose_html ?? null) as string | null}
      initialExposeEdits={(lr.expose_edits ?? null) as Record<string, unknown> | null}
      initialExposeTitle={exposeTitle}
      initialExposeKurz={exposeKurz}
    />
  )
}
