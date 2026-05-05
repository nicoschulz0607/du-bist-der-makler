import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { canAccess, type Tier } from '@/lib/tier'
import LockedPage from '@/components/dashboard/LockedPage'
import InteressentenClient from './InteressentenClient'

export const metadata = { title: 'Interessenten-CRM — Dashboard' }

async function createInteressent(formData: FormData): Promise<{ ok: boolean; id?: string; error?: string }> {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Nicht eingeloggt' }

  const { data: listing } = await supabase
    .from('listings').select('id').eq('user_id', user.id).limit(1).maybeSingle()
  if (!listing) return { ok: false, error: 'Kein Objekt gefunden. Bitte zuerst Objekt anlegen.' }

  const name = formData.get('name') as string
  if (!name?.trim()) return { ok: false, error: 'Name ist Pflicht' }

  const { data, error } = await supabase.from('interessenten').insert({
    listing_id: listing.id,
    name: name.trim(),
    email: (formData.get('email') as string) || null,
    telefon: (formData.get('telefon') as string) || null,
    nachricht: (formData.get('nachricht') as string) || null,
    quelle: (formData.get('quelle') as string) || 'manuell',
    status: 'neu',
  }).select('id').single()

  if (error) return { ok: false, error: 'Fehler beim Speichern.' }
  return { ok: true, id: data.id }
}

async function deleteInteressent(id: string): Promise<{ ok: boolean }> {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }
  await supabase.from('interessenten').delete().eq('id', id)
  return { ok: true }
}

export default async function InteressentenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('paket_tier').eq('id', user.id).single()

  const tier = (profile?.paket_tier ?? null) as Tier

  if (!canAccess(tier, 'pro')) {
    return (
      <LockedPage
        featureName="Interessenten-CRM"
        requiredTier="pro"
        description="Alle Interessenten-Anfragen zentral in einer Übersicht verwalten — Status setzen, Notizen anlegen, den Überblick behalten."
        benefits={[
          'Alle Anfragen übersichtlich in einer Tabelle',
          'Status-Tracking von Neu bis Kaufinteressent',
          'KI-Vorqualifizierung: Wer ist wirklich interessiert?',
        ]}
        upgradePrice="599 €"
      />
    )
  }

  const { data: listing } = await supabase
    .from('listings').select('id').eq('user_id', user.id).limit(1).maybeSingle()

  const { data: interessenten } = listing
    ? await supabase
        .from('interessenten')
        .select('id, name, email, telefon, status, quelle, ki_ampel, ki_score, created_at')
        .eq('listing_id', listing.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-text-primary mb-1" style={{ letterSpacing: '-0.18px' }}>
          Interessenten-CRM
        </h1>
        <p className="text-[14px] text-text-secondary">
          {interessenten?.length ?? 0} Interessent{(interessenten?.length ?? 0) !== 1 ? 'en' : ''} · {listing ? '' : 'Kein Objekt angelegt — '}
          {!listing && <a href="/dashboard/objekt" className="text-accent underline">Objekt anlegen</a>}
        </p>
      </div>
      <InteressentenClient
        interessenten={interessenten ?? []}
        hasListing={!!listing}
        tier={tier}
        onCreate={createInteressent}
        onDelete={deleteInteressent}
      />
    </div>
  )
}
