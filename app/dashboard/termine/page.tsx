import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { canAccess, type Tier } from '@/lib/tier'
import LockedPage from '@/components/dashboard/LockedPage'
import TermineClient from './TermineClient'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { buildIcal, buildAppointmentDatetime } from '@/lib/ical'

export const metadata = { title: 'Besichtigungen — Dashboard' }

async function createTermin(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Nicht eingeloggt' }

  const [{ data: listing }, { data: profile }] = await Promise.all([
    supabase.from('listings').select('id, adresse_strasse, adresse_plz, adresse_ort, objekttyp').eq('user_id', user.id).limit(1).maybeSingle(),
    supabase.from('profiles').select('vorname, email').eq('id', user.id).single(),
  ])
  if (!listing) return { ok: false, error: 'Kein Objekt gefunden.' }

  const datum = formData.get('datum') as string
  const uhrzeit_von = formData.get('uhrzeit_von') as string
  const uhrzeit_bis = formData.get('uhrzeit_bis') as string
  const notiz = (formData.get('notiz') as string) || null
  const interessentIds = JSON.parse((formData.get('interessent_ids') as string) || '[]') as string[]
  const sendMail = formData.get('send_mail') === 'true'

  if (!datum || !uhrzeit_von || !uhrzeit_bis) return { ok: false, error: 'Datum und Uhrzeiten sind Pflicht.' }

  const { data: termin, error } = await supabase.from('termine').insert({
    listing_id: listing.id,
    datum,
    uhrzeit_von,
    uhrzeit_bis,
    notiz,
    status: 'geplant',
  }).select('id, ical_uid, ical_sequence').single()

  if (error || !termin) return { ok: false, error: 'Termin konnte nicht gespeichert werden.' }

  if (interessentIds.length > 0) {
    await supabase.from('termine_interessenten').insert(
      interessentIds.map((id) => ({
        termin_id: termin.id,
        interessent_id: id,
        eingeladen_per_mail: sendMail,
      }))
    )

    // Auto-update status
    await supabase.from('interessenten')
      .update({ status: 'besichtigung_geplant' })
      .in('id', interessentIds)
      .in('status', ['neu', 'vorqualifiziert'])

    // Send invitation emails
    if (sendMail) {
      const { data: invitees } = await supabase
        .from('interessenten')
        .select('id, name, email')
        .in('id', interessentIds)
        .not('email', 'is', null)

      const adresse = [listing.adresse_strasse, listing.adresse_plz, listing.adresse_ort].filter(Boolean).join(', ')
      const dtstart = buildAppointmentDatetime(datum, uhrzeit_von)
      const dtend = buildAppointmentDatetime(datum, uhrzeit_bis)
      const dateStr = dtstart.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
      const timeStr = uhrzeit_von.slice(0, 5)

      await Promise.allSettled(
        (invitees ?? [])
          .filter(inv => inv.email)
          .map(inv => {
            const ical = buildIcal({
              uid: termin.ical_uid,
              sequence: termin.ical_sequence,
              method: 'REQUEST',
              dtstart,
              dtend,
              summary: `Besichtigung: ${adresse}`,
              description: `Besichtigungstermin für ${listing.objekttyp ?? 'Immobilie'} in ${adresse}.\n\nBitte Personalausweis mitbringen.\n\nRückfragen: ${profile?.vorname ?? ''} — ${profile?.email ?? ''}`,
              location: adresse,
              organizerName: profile?.vorname ?? 'Verkäufer',
              organizerEmail: profile?.email ?? user.email ?? '',
              attendeeName: inv.name,
              attendeeEmail: inv.email!,
            })
            return resend.emails.send({
              from: FROM_EMAIL,
              to: inv.email!,
              subject: `Besichtigungstermin: ${adresse} am ${dateStr} um ${timeStr} Uhr`,
              html: `<p>Hallo ${inv.name},</p>
<p>dein Besichtigungstermin für <strong>${adresse}</strong> wurde bestätigt:</p>
<p><strong>Datum:</strong> ${dateStr}<br>
<strong>Uhrzeit:</strong> ${timeStr} Uhr<br>
<strong>Adresse:</strong> ${adresse}</p>
<p>Bitte bringe deinen <strong>Personalausweis</strong> mit.</p>
<p>Für Rückfragen stehe ich gerne zur Verfügung:<br>
${profile?.vorname ?? 'Verkäufer'} · ${profile?.email ?? ''}</p>
<p>Bitte sei pünktlich, damit alle Interessenten ausreichend Zeit für die Besichtigung haben.</p>
<p><em>Diese Einladung enthält einen Kalender-Anhang (.ics), den du direkt in deinen Kalender importieren kannst.</em></p>`,
              attachments: [{ filename: 'besichtigung.ics', content: Buffer.from(ical).toString('base64') }],
            }).catch(() => {})
          })
      )
    }
  }

  return { ok: true }
}

async function updateTermin(terminId: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Nicht eingeloggt' }

  const datum = formData.get('datum') as string
  const uhrzeit_von = formData.get('uhrzeit_von') as string
  const uhrzeit_bis = formData.get('uhrzeit_bis') as string
  const notiz = (formData.get('notiz') as string) || null

  const { data: existing } = await supabase
    .from('termine').select('id, ical_uid, ical_sequence, datum, uhrzeit_von, uhrzeit_bis, listing_id').eq('id', terminId).single()
  if (!existing) return { ok: false, error: 'Termin nicht gefunden' }

  const dateChanged = datum !== existing.datum || uhrzeit_von !== existing.uhrzeit_von || uhrzeit_bis !== existing.uhrzeit_bis
  const newSequence = dateChanged ? existing.ical_sequence + 1 : existing.ical_sequence

  await supabase.from('termine').update({ datum, uhrzeit_von, uhrzeit_bis, notiz, ical_sequence: newSequence }).eq('id', terminId)

  // Resend emails if date/time changed and people were invited
  if (dateChanged) {
    const [{ data: listing }, { data: profile }, { data: invitees }] = await Promise.all([
      supabase.from('listings').select('adresse_strasse, adresse_plz, adresse_ort, objekttyp').eq('id', existing.listing_id).single(),
      supabase.from('profiles').select('vorname, email').eq('id', user.id).single(),
      supabase.from('termine_interessenten').select('interessenten(id, name, email)').eq('termin_id', terminId).eq('eingeladen_per_mail', true),
    ])

    const adresse = listing ? [listing.adresse_strasse, listing.adresse_plz, listing.adresse_ort].filter(Boolean).join(', ') : ''
    const dtstart = buildAppointmentDatetime(datum, uhrzeit_von)
    const dtend = buildAppointmentDatetime(datum, uhrzeit_bis)
    const dateStr = dtstart.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
    const timeStr = uhrzeit_von.slice(0, 5)

    await Promise.allSettled(
      (invitees ?? [])
        .map(link => (link as any).interessenten)
        .filter((inv: any) => inv?.email)
        .map((inv: any) => {
          const ical = buildIcal({
            uid: existing.ical_uid,
            sequence: newSequence,
            method: 'REQUEST',
            dtstart, dtend,
            summary: `Besichtigung: ${adresse}`,
            description: `Aktualisierter Termin für ${listing?.objekttyp ?? 'Immobilie'} in ${adresse}.`,
            location: adresse,
            organizerName: profile?.vorname ?? 'Verkäufer',
            organizerEmail: profile?.email ?? user.email ?? '',
            attendeeName: inv.name,
            attendeeEmail: inv.email,
          })
          return resend.emails.send({
            from: FROM_EMAIL,
            to: inv.email,
            subject: `Termin-Update: Besichtigung ${adresse} am ${dateStr} um ${timeStr} Uhr`,
            html: `<p>Hallo ${inv.name},</p><p>dein Besichtigungstermin wurde aktualisiert:</p><p><strong>Neues Datum:</strong> ${dateStr}<br><strong>Uhrzeit:</strong> ${timeStr} Uhr</p>`,
            attachments: [{ filename: 'besichtigung.ics', content: Buffer.from(ical).toString('base64') }],
          }).catch(() => {})
        })
    )
  }

  return { ok: true }
}

async function cancelTermin(terminId: string): Promise<{ ok: boolean }> {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const { data: existing } = await supabase
    .from('termine').select('id, ical_uid, ical_sequence, datum, uhrzeit_von, uhrzeit_bis, listing_id').eq('id', terminId).single()
  if (!existing) return { ok: false }

  const newSeq = existing.ical_sequence + 1
  await supabase.from('termine').update({ status: 'abgesagt', ical_sequence: newSeq }).eq('id', terminId)

  const [{ data: listing }, { data: profile }, { data: invitees }] = await Promise.all([
    supabase.from('listings').select('adresse_strasse, adresse_plz, adresse_ort, objekttyp').eq('id', existing.listing_id).single(),
    supabase.from('profiles').select('vorname, email').eq('id', user.id).single(),
    supabase.from('termine_interessenten').select('interessenten(id, name, email)').eq('termin_id', terminId).eq('eingeladen_per_mail', true),
  ])

  const adresse = listing ? [listing.adresse_strasse, listing.adresse_plz, listing.adresse_ort].filter(Boolean).join(', ') : ''
  const dtstart = buildAppointmentDatetime(existing.datum, existing.uhrzeit_von)
  const dtend = buildAppointmentDatetime(existing.datum, existing.uhrzeit_bis)

  await Promise.allSettled(
    (invitees ?? [])
      .map(link => (link as any).interessenten)
      .filter((inv: any) => inv?.email)
      .map((inv: any) => {
        const ical = buildIcal({
          uid: existing.ical_uid, sequence: newSeq, method: 'CANCEL',
          dtstart, dtend, summary: `Abgesagt: Besichtigung ${adresse}`,
          description: 'Dieser Termin wurde abgesagt.',
          location: adresse,
          organizerName: profile?.vorname ?? 'Verkäufer',
          organizerEmail: profile?.email ?? user.email ?? '',
          attendeeName: inv.name, attendeeEmail: inv.email,
        })
        return resend.emails.send({
          from: FROM_EMAIL,
          to: inv.email,
          subject: `Abgesagt: Besichtigung ${adresse}`,
          html: `<p>Hallo ${inv.name},</p><p>der Besichtigungstermin für <strong>${adresse}</strong> wurde leider abgesagt.</p>`,
          attachments: [{ filename: 'absage.ics', content: Buffer.from(ical).toString('base64') }],
        }).catch(() => {})
      })
  )

  return { ok: true }
}

export default async function TerminePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: listing }] = await Promise.all([
    supabase.from('profiles').select('paket_tier').eq('id', user.id).single(),
    supabase.from('listings').select('id, adresse_strasse, adresse_plz, adresse_ort').eq('user_id', user.id).limit(1).maybeSingle(),
  ])
  const tier = (profile?.paket_tier ?? null) as Tier

  if (!canAccess(tier, 'pro')) {
    return (
      <LockedPage
        featureName="Besichtigungskalender"
        requiredTier="pro"
        description="Plane und verwalte Besichtigungstermine direkt im Dashboard — mit automatischen E-Mail-Bestätigungen für Interessenten."
        benefits={[
          'Besichtigungskalender mit Wochen- und Listenansicht',
          'Automatische E-Mail-Bestätigungen mit iCal-Anhang',
          'Gruppenbesichtigungen mit mehreren Interessenten',
        ]}
        upgradePrice="599 €"
      />
    )
  }

  const [{ data: termine }, { data: interessenten }] = listing
    ? await Promise.all([
        supabase
          .from('termine')
          .select(`id, datum, uhrzeit_von, uhrzeit_bis, notiz, status, ical_uid, ical_sequence,
            termine_interessenten(interessent_id, eingeladen_per_mail, interessenten(id, name, email))`)
          .eq('listing_id', listing.id)
          .order('datum', { ascending: true })
          .order('uhrzeit_von', { ascending: true }),
        supabase
          .from('interessenten')
          .select('id, name, email')
          .eq('listing_id', listing.id)
          .neq('status', 'abgesagt')
          .order('name'),
      ])
    : [{ data: [] }, { data: [] }]

  const onUpdate = updateTermin.bind(null)
  const onCancel = cancelTermin.bind(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-text-primary mb-1" style={{ letterSpacing: '-0.18px' }}>
          Besichtigungskalender
        </h1>
        <p className="text-[14px] text-text-secondary">
          {(termine?.length ?? 0)} Termin{(termine?.length ?? 0) !== 1 ? 'e' : ''} geplant
        </p>
      </div>
      <TermineClient
        termine={(termine ?? []) as any}
        interessenten={interessenten ?? []}
        hasListing={!!listing}
        onCreate={createTermin}
        onUpdate={onUpdate}
        onCancel={onCancel}
      />
    </div>
  )
}
