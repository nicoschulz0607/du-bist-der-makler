import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ObjektForm from './ObjektForm'

export const metadata = { title: 'Mein Objekt — Dashboard' }

async function speicherObjekt(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const listingId = formData.get('listing_id') as string | null

  const payload = {
    user_id: user.id,
    objekttyp: (formData.get('objekttyp') as string) || null,
    adresse_strasse: (formData.get('adresse_strasse') as string) || null,
    adresse_plz: (formData.get('adresse_plz') as string) || null,
    adresse_ort: (formData.get('adresse_ort') as string) || null,
    wohnflaeche_qm: formData.get('wohnflaeche_qm') ? Number(formData.get('wohnflaeche_qm')) : null,
    zimmer: formData.get('zimmer') ? Number(formData.get('zimmer')) : null,
    baujahr: formData.get('baujahr') ? Number(formData.get('baujahr')) : null,
    zustand: (formData.get('zustand') as string) || null,
    preis: formData.get('preis') ? Number(formData.get('preis')) : null,
    energieausweis_klasse: (formData.get('energieausweis_klasse') as string) || null,
    beschreibung: (formData.get('beschreibung') as string) || null,
    fotos: (() => {
      try { return JSON.parse(formData.get('fotos') as string) } catch { return [] }
    })(),
  }

  if (listingId) {
    await supabase
      .from('listings')
      .update(payload)
      .eq('id', listingId)
      .eq('user_id', user.id)
  } else {
    await supabase.from('listings').insert({ ...payload, status: 'draft' })
  }
}

export default async function ObjektPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: listing } = await supabase
    .from('listings')
    .select('id, objekttyp, adresse_strasse, adresse_plz, adresse_ort, wohnflaeche_qm, zimmer, baujahr, zustand, preis, energieausweis_klasse, beschreibung, status, fotos')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-text-primary mb-1" style={{ letterSpacing: '-0.18px' }}>
          Mein Objekt
        </h1>
        <p className="text-[14px] text-text-secondary">
          Trage deine Immobiliendaten ein — Basis für Inserat-Texte, KI-Exposé PDF und die Checkliste.
        </p>
      </div>
      <ObjektForm listing={listing ?? null} userId={user.id} save={speicherObjekt} />
    </div>
  )
}
