import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccess } from '@/lib/tier'
import { fillTemplate } from '@/lib/pdf/fill-template'

export const maxDuration = 15

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('paket_tier')
    .eq('id', user.id)
    .single()

  if (!canAccess(profile?.paket_tier ?? null, 'pro')) {
    return NextResponse.json({ error: 'Pro-Paket erforderlich' }, { status: 403 })
  }

  const { data: listing } = await supabase
    .from('listings')
    .select(
      'id, objekttyp, adresse_strasse, adresse_plz, adresse_ort, wohnflaeche_qm, zimmer, baujahr, zustand, preis, energieausweis_klasse, grundriss_url, fotos, expose_html, badezimmer, schlafzimmer, etage, nutzflaeche_qm, grundstueck_qm, renovierungsjahr, heizungsart, energieausweis_typ, energieverbrauch, energietraeger, ausstattung_items, lat, lon, infra_json'
    )
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!listing?.expose_html) {
    return NextResponse.json({ error: 'Bitte zuerst Inserat-Texte generieren.' }, { status: 400 })
  }

  let expose
  try {
    expose = JSON.parse(listing.expose_html)
  } catch {
    return NextResponse.json(
      { error: 'Ungültige Exposé-Daten. Bitte Texte neu generieren.' },
      { status: 400 }
    )
  }

  const html = await fillTemplate({
    listing: { ...listing, fotos: Array.isArray(listing.fotos) ? listing.fotos : [] },
    expose,
    userName: user.user_metadata?.full_name ?? user.email?.split('@')[0],
    userEmail: user.email,
  })

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
