import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { geocodeAddress } from '@/lib/infra'

export const maxDuration = 15

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

  const existingInfra = listing.infra_json as Record<string, unknown> | null
  const hasInfra = !!existingInfra && Object.values(existingInfra).some(v => v != null)

  const addressUnchanged =
    listing.lat != null &&
    listing.lon != null &&
    Math.abs(listing.lat - newLat) < 0.001 &&
    Math.abs(listing.lon - newLon) < 0.001

  if (addressUnchanged) {
    return NextResponse.json({ ok: true, lat: newLat, lon: newLon, has_infra: hasInfra, skipped: true })
  }

  // Address changed or first geocode — save coordinates; infra will be fetched client-side
  await supabase.from('listings')
    .update({ lat: newLat, lon: newLon })
    .eq('id', listing_id)
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true, lat: newLat, lon: newLon, has_infra: false })
}
