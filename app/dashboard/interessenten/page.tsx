import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { canAccess, type Tier } from '@/lib/tier'
import LockedPage from '@/components/dashboard/LockedPage'
import InteressentenListe from './InteressentenListe'
import { logEvent } from '@/lib/activity/log'
import { EVENT_TYPES } from '@/lib/activity/types'

export const metadata = { title: 'Interessenten-CRM — Dashboard' }

async function createInteressent(formData: FormData): Promise<{ ok: boolean; id?: string; error?: string }> {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Nicht eingeloggt' }

  const { data: listing } = await supabase
    .from('listings')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!listing) return { ok: false, error: 'Kein Objekt gefunden. Bitte zuerst Objekt anlegen.' }

  const name = formData.get('name') as string
  if (!name?.trim()) return { ok: false, error: 'Name ist Pflicht' }

  const { data, error } = await supabase
    .from('interessenten')
    .insert({
      listing_id: listing.id,
      name: name.trim(),
      email: (formData.get('email') as string) || null,
      telefon: (formData.get('telefon') as string) || null,
      nachricht: (formData.get('nachricht') as string) || null,
      quelle: (formData.get('quelle') as string) || 'manuell',
      status: 'neu',
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: 'Fehler beim Speichern.' }

  await logEvent({
    user_id: user.id,
    listing_id: listing.id,
    interessent_id: data.id,
    event_type: EVENT_TYPES.INTERESSENT_ANGELEGT,
    payload: { name: name.trim(), quelle: (formData.get('quelle') as string) || 'manuell' },
    source: 'user',
    user_sichtbar: true,
  })

  return { ok: true, id: data.id }
}

export default async function InteressentenPage({
  searchParams,
}: {
  searchParams: Promise<{ ausgewaehlt?: string; filter?: string; tab?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: listing }] = await Promise.all([
    supabase.from('profiles').select('paket_tier').eq('id', user.id).single(),
    supabase.from('listings').select('id').eq('user_id', user.id).limit(1).maybeSingle(),
  ])

  const tier = (profile?.paket_tier ?? null) as Tier

  if (!canAccess(tier, 'pro')) {
    return (
      <LockedPage
        featureName="Interessenten-CRM"
        requiredTier="pro"
        description="Alle Interessenten-Anfragen zentral in einer Übersicht verwalten — Status setzen, Notizen anlegen, den Überblick behalten."
        benefits={[
          'Alle Anfragen übersichtlich in einer Übersicht',
          'Status-Tracking von Neu bis Kaufinteressent',
          'KI-Vorqualifizierung: Wer ist wirklich interessiert?',
        ]}
        upgradePrice="599 €"
      />
    )
  }

  const { data: interessenten } = listing
    ? await supabase
        .from('interessenten')
        .select('*')
        .eq('listing_id', listing.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <InteressentenListe
      interessenten={interessenten ?? []}
      ausgewaehltId={params.ausgewaehlt ?? null}
      filter={params.filter ?? 'alle'}
      tab={params.tab ?? 'nachricht'}
      tier={tier ?? 'starter'}
      listingId={listing?.id ?? ''}
      onCreate={createInteressent}
    />
  )
}
