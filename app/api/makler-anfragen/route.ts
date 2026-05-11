import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resend, FROM_SUPPORT } from '@/lib/resend'
import { anfrageBestätigungKunde, anfrageNotificationMakler } from '@/lib/emails/makler-support'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('makler_anfragen')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { thema, beschreibung, wunschtermine, telefon, listing_id } = body

  if (!thema || !['preisverhandlung', 'vertragsfragen', 'besichtigung', 'sonstiges'].includes(thema)) {
    return NextResponse.json({ error: 'Ungültiges Thema' }, { status: 400 })
  }
  if (!beschreibung || typeof beschreibung !== 'string' || beschreibung.trim().length === 0) {
    return NextResponse.json({ error: 'Beschreibung erforderlich' }, { status: 400 })
  }
  if (beschreibung.length > 1000) {
    return NextResponse.json({ error: 'Beschreibung zu lang (max. 1000 Zeichen)' }, { status: 400 })
  }
  if (!Array.isArray(wunschtermine) || wunschtermine.length === 0) {
    return NextResponse.json({ error: 'Mindestens ein Wunschtermin erforderlich' }, { status: 400 })
  }
  if (!telefon || typeof telefon !== 'string' || telefon.trim().length === 0) {
    return NextResponse.json({ error: 'Telefonnummer erforderlich' }, { status: 400 })
  }

  const insertData: Record<string, unknown> = {
    user_id: user.id,
    thema,
    beschreibung: beschreibung.trim(),
    wunschtermine,
    telefon: telefon.trim(),
    status: 'neu',
  }
  if (listing_id) insertData.listing_id = listing_id

  const { data: anfrage, error: insertError } = await supabase
    .from('makler_anfragen')
    .insert(insertData)
    .select('id')
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('vorname, paket_tier')
    .eq('id', user.id)
    .single()

  const vorname = (profile?.vorname as string | null) ?? 'Kunde'
  const tier = (profile?.paket_tier as string | null) ?? 'basic'
  const adminLink = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin/makler-anfragen/${anfrage.id}`

  const bestätigung = anfrageBestätigungKunde({ vorname, thema, wunschtermine })
  const notification = anfrageNotificationMakler({
    vorname,
    email: user.email ?? '',
    telefon: telefon.trim(),
    tier,
    thema,
    beschreibung: beschreibung.trim(),
    wunschtermine,
    adminLink,
  })

  await Promise.allSettled([
    resend.emails.send({
      from: FROM_SUPPORT,
      to: user.email!,
      subject: bestätigung.subject,
      html: bestätigung.html,
    }),
    resend.emails.send({
      from: FROM_SUPPORT,
      to: process.env.MAKLER_NOTIFICATION_EMAIL!,
      subject: notification.subject,
      html: notification.html,
    }),
  ])

  return NextResponse.json({ success: true, id: anfrage.id })
}
