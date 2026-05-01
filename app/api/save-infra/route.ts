import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listing_id, infra_json } = await req.json()

  await supabase.from('listings')
    .update({ infra_json })
    .eq('id', listing_id)
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
