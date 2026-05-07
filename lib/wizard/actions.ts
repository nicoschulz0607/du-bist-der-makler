'use server'

import { createClient } from '@/lib/supabase/server'
import type { StationStatusEntry, StationStatusMap, WizardProfile } from './types'

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
      aktuelle_station: Math.min(stationNum + 1, 12),
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
