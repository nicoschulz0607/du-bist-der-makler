import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL } from '@/lib/resend'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const todayStr = now.toISOString().slice(0, 10)
  const tomorrowStr = in24h.toISOString().slice(0, 10)

  // Termine in den nächsten 24h, Erinnerung noch nicht versendet
  const { data: termine } = await supabase
    .from('termine')
    .select(`
      id, datum, uhrzeit_von, uhrzeit_bis, listing_id,
      listings!inner(adresse_strasse, adresse_plz, adresse_ort, user_id),
      termine_interessenten(eingeladen_per_mail, interessenten(name, email))
    `)
    .eq('status', 'geplant')
    .eq('erinnerung_24h_versendet', false)
    .gte('datum', todayStr)
    .lte('datum', tomorrowStr)

  let sent = 0

  for (const termin of termine ?? []) {
    const listing = (termin as any).listings
    if (!listing) continue

    const adresse = [listing.adresse_strasse, listing.adresse_plz, listing.adresse_ort].filter(Boolean).join(', ')
    const dateStr = new Date(termin.datum + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
    const timeStr = termin.uhrzeit_von.slice(0, 5)

    // Get seller email
    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('vorname, email')
      .eq('id', listing.user_id)
      .single()

    // Send to seller
    if (sellerProfile?.email) {
      const invNames = (termin as any).termine_interessenten
        .map((ti: any) => ti.interessenten?.name).filter(Boolean).join(', ')
      await resend.emails.send({
        from: FROM_EMAIL,
        to: sellerProfile.email,
        subject: `Heute Besichtigung: ${adresse} um ${timeStr} Uhr`,
        html: `<p>Hallo ${sellerProfile.vorname ?? 'du'},</p>
<p>heute hast du eine Besichtigung für <strong>${adresse}</strong>:</p>
<p><strong>Uhrzeit:</strong> ${timeStr} Uhr<br>
<strong>Interessenten:</strong> ${invNames || 'keine eingeladen'}</p>
<p>Viel Erfolg!</p>`,
      }).catch(() => {})
      sent++
    }

    // Send to interested parties
    for (const ti of (termin as any).termine_interessenten ?? []) {
      if (!ti.eingeladen_per_mail) continue
      const inv = ti.interessenten
      if (!inv?.email) continue

      await resend.emails.send({
        from: FROM_EMAIL,
        to: inv.email,
        subject: `Erinnerung: Besichtigung heute um ${timeStr} Uhr`,
        html: `<p>Hallo ${inv.name},</p>
<p>nur eine kurze Erinnerung: dein Besichtigungstermin ist <strong>heute</strong>!</p>
<p><strong>Uhrzeit:</strong> ${timeStr} Uhr<br>
<strong>Adresse:</strong> ${adresse}</p>
<p>Bitte vergiss deinen <strong>Personalausweis</strong> nicht.</p>
<p>Bis gleich!<br>${sellerProfile?.vorname ?? 'Verkäufer'}</p>`,
      }).catch(() => {})
      sent++
    }

    // Mark as sent
    await supabase.from('termine').update({ erinnerung_24h_versendet: true }).eq('id', termin.id)
  }

  return NextResponse.json({ ok: true, terminCount: (termine ?? []).length, emailsSent: sent })
}
