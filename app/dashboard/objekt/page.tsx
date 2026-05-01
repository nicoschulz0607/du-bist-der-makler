import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ObjektForm from './ObjektForm'
import { geocodeAddress, fetchInfrastruktur } from '@/lib/infra'

export const metadata = { title: 'Mein Objekt — Dashboard' }

async function speicherObjekt(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const listingId = formData.get('listing_id') as string | null

  const num = (key: string) => {
    const v = formData.get(key)
    return v && v !== '' ? Number(v) : null
  }
  const str = (key: string) => (formData.get(key) as string) || null

  const payload = {
    user_id: user.id,
    objekttyp: str('objekttyp'),
    adresse_strasse: str('adresse_strasse'),
    adresse_plz: str('adresse_plz'),
    adresse_ort: str('adresse_ort'),
    wohnflaeche_qm: num('wohnflaeche_qm'),
    zimmer: num('zimmer'),
    baujahr: num('baujahr'),
    zustand: str('zustand'),
    preis: num('preis'),
    energieausweis_klasse: str('energieausweis_klasse'),
    beschreibung: str('beschreibung'),
    fotos: (() => { try { return JSON.parse(formData.get('fotos') as string) } catch { return [] } })(),
    badezimmer: num('badezimmer'),
    schlafzimmer: num('schlafzimmer'),
    etage: str('etage'),
    nutzflaeche_qm: num('nutzflaeche_qm'),
    grundstueck_qm: num('grundstueck_qm'),
    renovierungsjahr: num('renovierungsjahr'),
    heizungsart: str('heizungsart'),
    energieausweis_typ: str('energieausweis_typ'),
    energieverbrauch: num('energieverbrauch'),
    energietraeger: str('energietraeger'),
    ausstattung_items: (() => { try { return JSON.parse(formData.get('ausstattung_items') as string) } catch { return [] } })(),
  }

  let savedId: string | null = listingId
  let needsGeo = false

  if (listingId) {
    const { data: existing } = await supabase
      .from('listings')
      .select('lat, adresse_strasse, adresse_plz, adresse_ort')
      .eq('id', listingId).eq('user_id', user.id).single()
    needsGeo = !existing?.lat ||
      existing.adresse_strasse !== (payload.adresse_strasse ?? null) ||
      existing.adresse_plz !== (payload.adresse_plz ?? null) ||
      existing.adresse_ort !== (payload.adresse_ort ?? null)
    await supabase.from('listings').update(payload).eq('id', listingId).eq('user_id', user.id)
  } else {
    const { data: inserted } = await supabase
      .from('listings').insert({ ...payload, status: 'draft' }).select('id').single()
    savedId = inserted?.id ?? null
    needsGeo = true
  }

  if (needsGeo && savedId && (payload.adresse_strasse || payload.adresse_ort)) {
    const coords = await geocodeAddress(payload.adresse_strasse, payload.adresse_plz, payload.adresse_ort)
    if (coords) {
      const infra = await fetchInfrastruktur(parseFloat(coords.lat), parseFloat(coords.lon))
      await supabase.from('listings').update({
        lat: parseFloat(coords.lat),
        lon: parseFloat(coords.lon),
        infra_json: infra,
      }).eq('id', savedId).eq('user_id', user.id)
    }
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
    .select(`
      id, objekttyp, adresse_strasse, adresse_plz, adresse_ort,
      wohnflaeche_qm, zimmer, baujahr, zustand, preis,
      energieausweis_klasse, beschreibung, status, fotos,
      badezimmer, schlafzimmer, etage, nutzflaeche_qm, grundstueck_qm,
      renovierungsjahr, heizungsart, energieausweis_typ, energieverbrauch,
      energietraeger, ausstattung_items
    `)
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
          Trage deine Immobiliendaten ein — Basis für Inserat-Texte, KI-Exposé und die Checkliste.
        </p>
      </div>
      <ObjektForm listing={listing ?? null} userId={user.id} save={speicherObjekt} />
    </div>
  )
}
