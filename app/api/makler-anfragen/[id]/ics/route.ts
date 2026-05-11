import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildIcal } from '@/lib/ical'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: anfrage } = await (supabase as any)
    .from('makler_anfragen')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single() as { data: Record<string, unknown> | null }

  if (!anfrage || !anfrage['bestätigter_termin']) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const start = new Date(anfrage['bestätigter_termin'] as string)
  const dauer = (anfrage['bestätigte_dauer_minuten'] as number | null) ?? 60
  const end = new Date(start.getTime() + dauer * 60 * 1000)

  const { data: profile } = await supabase
    .from('profiles')
    .select('vorname')
    .eq('id', user.id)
    .single()

  const ics = buildIcal({
    uid: `makler-${anfrage['id']}`,
    sequence: 0,
    method: 'REQUEST',
    dtstart: start,
    dtend: end,
    summary: 'Makler-Beratung — dubistdermakler.de',
    description: `Thema: ${anfrage['thema']}\n\n${anfrage['beschreibung']}`,
    location: 'Telefonisch',
    organizerName: 'Makler-Team',
    organizerEmail: 'kontakt@dubistdermakler.de',
    attendeeName: (profile?.vorname as string | null) ?? 'Kunde',
    attendeeEmail: user.email ?? '',
  })

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="beratung-${id}.ics"`,
    },
  })
}
