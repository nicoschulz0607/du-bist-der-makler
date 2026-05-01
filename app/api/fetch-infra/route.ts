import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchInfrastruktur } from '@/lib/infra'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listing_id } = await req.json()

  const { data: listing } = await supabase
    .from('listings')
    .select('id, lat, lon')
    .eq('id', listing_id)
    .eq('user_id', user.id)
    .single()

  if (!listing?.lat || !listing?.lon) {
    return NextResponse.json({ ok: false, reason: 'no_coords' })
  }

  const infra = await fetchInfrastruktur(listing.lat, listing.lon)

  if (Object.keys(infra).length > 0) {
    await supabase.from('listings')
      .update({ infra_json: infra })
      .eq('id', listing_id)
      .eq('user_id', user.id)
  }

  return NextResponse.json({ ok: true, infra_keys: Object.keys(infra).length })
}
