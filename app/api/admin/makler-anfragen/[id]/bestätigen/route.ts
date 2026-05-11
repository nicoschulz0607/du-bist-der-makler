import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isAdmin } from '@/lib/auth/isAdmin'
import { resend, FROM_SUPPORT } from '@/lib/resend'
import { terminBestätigung } from '@/lib/emails/makler-support'
import { buildIcal } from '@/lib/ical'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { bestätigter_termin, dauer_minuten, admin_notiz } = body

  if (!bestätigter_termin || typeof bestätigter_termin !== 'string') {
    return NextResponse.json({ error: 'bestätigter_termin erforderlich' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: anfrage } = await service
    .from('makler_anfragen')
    .select('id, user_id, thema, beschreibung, telefon, status')
    .eq('id', id)
    .single()

  if (!anfrage) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (anfrage.status !== 'neu') {
    return NextResponse.json({ error: 'Anfrage ist nicht mehr offen' }, { status: 409 })
  }

  const { data: profile } = await service
    .from('profiles')
    .select('vorname, paket_tier')
    .eq('id', anfrage.user_id)
    .single()

  const { data: authUser } = await service.auth.admin.getUserById(anfrage.user_id as string)
  const kundeEmail = authUser?.user?.email ?? ''

  const { data: inklusivGenutzt } = await service.rpc('user_hat_inklusiv_stunde_genutzt', {
    check_user_id: anfrage.user_id,
  })

  const tier = (profile?.paket_tier as string | null) ?? 'basic'
  const isPremium = tier === 'premium'
  const inklusiv = isPremium && !inklusivGenutzt

  const updateData: Record<string, unknown> = {
    status: 'bestätigt',
    bestätigter_termin,
    bestätigte_dauer_minuten: dauer_minuten ?? 60,
  }
  if (admin_notiz) updateData.admin_notiz = admin_notiz
  if (inklusiv) {
    updateData.inklusiv_stunde_genutzt = true
    updateData.bezahlt = true
  } else {
    updateData.payment_link_sent_at = new Date().toISOString()
  }

  await service.from('makler_anfragen').update(updateData).eq('id', id)

  const start = new Date(bestätigter_termin)
  const dauer = dauer_minuten ?? 60
  const end = new Date(start.getTime() + dauer * 60 * 1000)

  const ics = buildIcal({
    uid: `makler-${id}`,
    sequence: 0,
    method: 'REQUEST',
    dtstart: start,
    dtend: end,
    summary: 'Makler-Beratung — dubistdermakler.de',
    description: `Thema: ${anfrage.thema}\n\n${anfrage.beschreibung}`,
    location: 'Telefonisch',
    organizerName: 'Makler-Team',
    organizerEmail: 'kontakt@dubistdermakler.de',
    attendeeName: (profile?.vorname as string | null) ?? 'Kunde',
    attendeeEmail: kundeEmail,
  })

  const mail = terminBestätigung({
    vorname: (profile?.vorname as string | null) ?? 'Kunde',
    bestätigterTermin: bestätigter_termin,
    dauer,
    telefon: anfrage.telefon as string,
    thema: anfrage.thema as string,
    beschreibung: anfrage.beschreibung as string,
    inklusiv,
    paymentLink: inklusiv ? undefined : process.env.STRIPE_PAYMENT_LINK_MAKLER_STUNDE,
    icsContent: ics,
  })

  await resend.emails.send({
    from: FROM_SUPPORT,
    to: kundeEmail,
    subject: mail.subject,
    html: mail.html,
    attachments: [mail.attachment],
  }).catch(() => {})

  return NextResponse.json({ success: true })
}
