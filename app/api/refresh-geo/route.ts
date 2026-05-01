import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { geocodeAddress, fetchInfrastruktur } from '@/lib/infra'

export const maxDuration = 45

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listing_id } = await req.json()

  const { data: listing } = await supabase
    .from('listings')
    .select('id, adresse_strasse, adresse_plz, adresse_ort, lat, lon, infra_json')
    .eq('id', listing_id)
    .eq('user_id', user.id)
    .single()

  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const coords = await geocodeAddress(listing.adresse_strasse, listing.adresse_plz, listing.adresse_ort)
  if (!coords) return NextResponse.json({ ok: false, reason: 'geocode_failed' })

  const newLat = parseFloat(coords.lat)
  const newLon = parseFloat(coords.lon)

  // Skip Overpass if address hasn't moved (within ~100 m) and infra_json already has data
  const existingInfra = listing.infra_json as Record<string, unknown> | null
  const addressUnchanged =
    listing.lat != null &&
    listing.lon != null &&
    Math.abs(listing.lat - newLat) < 0.001 &&
    Math.abs(listing.lon - newLon) < 0.001

  if (addressUnchanged && existingInfra && Object.keys(existingInfra).length > 0) {
    return NextResponse.json({ ok: true, infra_keys: Object.keys(existingInfra).length, skipped: true })
  }

  const infra = await fetchInfrastruktur(newLat, newLon)

  await supabase.from('listings').update({
    lat: newLat,
    lon: newLon,
    infra_json: infra,
  }).eq('id', listing_id).eq('user_id', user.id)

  return NextResponse.json({ ok: true, infra_keys: Object.keys(infra).length })
}
