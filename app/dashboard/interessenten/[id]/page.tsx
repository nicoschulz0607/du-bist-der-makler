import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { canAccess, type Tier } from '@/lib/tier'
import InteressentDetail from './InteressentDetail'

export const metadata = { title: 'Interessent — Dashboard' }

async function saveInteressent(id: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Nicht eingeloggt' }

  const str = (key: string) => (formData.get(key) as string) || null
  const num = (key: string) => {
    const v = formData.get(key)
    return v && v !== '' ? Number(v) : null
  }
  const int = (key: string) => {
    const v = formData.get(key)
    return v && v !== '' ? parseInt(v as string, 10) : null
  }

  const { error } = await supabase.from('interessenten').update({
    name: (formData.get('name') as string).trim(),
    email: str('email'),
    telefon: str('telefon'),
    nachricht: str('nachricht'),
    status: str('status') ?? 'neu',
    notizen: str('notizen'),
    quelle: str('quelle'),
    altersgruppe: str('altersgruppe'),
    haushalt: str('haushalt'),
    beruf: str('beruf'),
    wohnsituation_aktuell: str('wohnsituation_aktuell'),
    finanzierung_status: str('finanzierung_status'),
    eigenkapital_range: str('eigenkapital_range'),
    zeithorizont: str('zeithorizont'),
    motivation: str('motivation'),
    andere_objekte_besichtigt: str('andere_objekte_besichtigt'),
    eindruck_erstgespraech: str('eindruck_erstgespraech'),
    eindruck_nach_besichtigung: str('eindruck_nach_besichtigung'),
    reaktion_auf_preis: str('reaktion_auf_preis'),
    bedenken: str('bedenken'),
    abgegebenes_angebot: num('abgegebenes_angebot'),
    bewertung_stars: int('bewertung_stars'),
  }).eq('id', id)

  if (error) return { ok: false, error: 'Fehler beim Speichern.' }
  return { ok: true }
}

export default async function InteressentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: int }, { data: terminLinks }] = await Promise.all([
    supabase.from('profiles').select('paket_tier').eq('id', user.id).single(),
    supabase.from('interessenten').select('*').eq('id', id).single(),
    supabase
      .from('termine_interessenten')
      .select('termin_id, eingeladen_per_mail, zugesagt, erschienen, termine(id, datum, uhrzeit_von, uhrzeit_bis, status, notiz)')
      .eq('interessent_id', id)
      .order('created_at', { ascending: false }),
  ])

  const tier = (profile?.paket_tier ?? null) as Tier
  if (!canAccess(tier, 'pro')) redirect('/dashboard/interessenten')

  if (!int) notFound()

  const termine = (terminLinks ?? []).map((tl: any) => ({
    ...tl.termine,
    eingeladen_per_mail: tl.eingeladen_per_mail,
    zugesagt: tl.zugesagt,
    erschienen: tl.erschienen,
  }))

  const save = saveInteressent.bind(null, id)

  return (
    <InteressentDetail
      interessent={int}
      termine={termine}
      tier={tier}
      onSave={save}
    />
  )
}
