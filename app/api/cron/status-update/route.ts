import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const todayStr = new Date().toISOString().slice(0, 10)

  // Termine von heute (die jetzt vorbei sind) → zugehörige Interessenten auf 'besichtigt' setzen
  const { data: termine } = await supabase
    .from('termine')
    .select('id, termine_interessenten(interessent_id)')
    .eq('datum', todayStr)
    .eq('status', 'geplant')

  let updated = 0

  for (const termin of termine ?? []) {
    const ids = termin.termine_interessenten.map((ti: any) => ti.interessent_id)
    if (ids.length === 0) continue

    await supabase.from('interessenten')
      .update({ status: 'besichtigt' })
      .in('id', ids)
      .eq('status', 'besichtigung_geplant')

    await supabase.from('termine').update({ status: 'durchgefuehrt' }).eq('id', termin.id)
    updated++
  }

  return NextResponse.json({ ok: true, termineProcessed: updated })
}
