import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listing_id, expose, infra } = await req.json()
  if (!listing_id) return NextResponse.json({ error: 'Missing listing_id' }, { status: 400 })

  const { data: listing } = await supabase
    .from('listings')
    .select('id, expose_html')
    .eq('id', listing_id)
    .eq('user_id', user.id)
    .single()

  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let currentExpose: Record<string, unknown> = {}
  try {
    if (listing.expose_html) currentExpose = JSON.parse(listing.expose_html)
  } catch {}

  const mergedExpose: Record<string, unknown> = { ...currentExpose }
  if (expose && typeof expose === 'object') {
    for (const [key, value] of Object.entries(expose as Record<string, unknown>)) {
      if (value != null) mergedExpose[key] = value
    }
  }

  const updateData: Record<string, unknown> = { expose_html: JSON.stringify(mergedExpose) }

  if (infra && typeof infra === 'object') {
    const filteredInfra = Object.fromEntries(
      Object.entries(infra as Record<string, unknown>).filter(([, v]) => v != null)
    )
    updateData.infra_json = filteredInfra
  }

  const { error } = await supabase
    .from('listings')
    .update(updateData)
    .eq('id', listing_id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
