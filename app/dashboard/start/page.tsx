import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WizardShell from '@/components/wizard/WizardShell'
import type { StationStatusMap, WizardProfile } from '@/lib/wizard/types'

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
      .select('id, objekttyp, adresse_strasse, adresse_plz, adresse_ort, wohnflaeche_qm, zimmer, baujahr')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('vorname, nachname, telefon, anschrift')
      .eq('id', user.id)
      .single(),
  ])

  if (!progressResult.data) {
    await supabase.from('wizard_progress').insert({ user_id: user.id })
  }

  const station = progressResult.data?.aktuelle_station ?? 1
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

  const initialListingData = listingResult.data
    ? {
        objekttyp: listingResult.data.objekttyp ?? null,
        adresse_strasse: listingResult.data.adresse_strasse ?? null,
        adresse_plz: listingResult.data.adresse_plz ?? null,
        adresse_ort: listingResult.data.adresse_ort ?? null,
        wohnflaeche_qm: listingResult.data.wohnflaeche_qm ?? null,
        zimmer: listingResult.data.zimmer ?? null,
        baujahr: listingResult.data.baujahr ?? null,
      }
    : null

  return (
    <WizardShell
      initialStation={station}
      stationStatus={stationStatus}
      listingId={listingResult.data?.id ?? null}
      wizardProfile={wizardProfile}
      profileData={profileData}
      userEmail={user.email ?? ''}
      initialListingData={initialListingData}
    />
  )
}
