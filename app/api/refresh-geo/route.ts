import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { geocodeAddress, fetchInfrastruktur } from '@/lib/infra'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listing_id } = await req.json()

  const { data: listing } = await supabase
    .from('listings')
    .select('id, adresse_strasse, adresse_plz, adresse_ort')
    .eq('id', listing_id)
    .eq('user_id', user.id)
    .single()

  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const coords = await geocodeAddress(listing.adresse_strasse, listing.adresse_plz, listing.adresse_ort)
  if (!coords) return NextResponse.json({ ok: false, reason: 'geocode_failed' })

  const infra = await fetchInfrastruktur(parseFloat(coords.lat), parseFloat(coords.lon))

  await supabase.from('listings').update({
    lat: parseFloat(coords.lat),
    lon: parseFloat(coords.lon),
    infra_json: infra,
  }).eq('id', listing_id).eq('user_id', user.id)

  return NextResponse.json({ ok: true, infra_keys: Object.keys(infra).length })
}
