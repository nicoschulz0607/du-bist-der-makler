'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { resend, FROM_SUPPORT } from '@/lib/resend'
import { dokumentShareEmail } from '@/lib/emails/dokument-share'

// ── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // Umlaute: Müller→Muller
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 100)
}

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

// ── Energieausweis-Sync: beim ersten Aufruf von /dashboard/unterlagen ────────
// Übernimmt listing.energieausweis_status/-datei_url in die dokumente-Tabelle.
// ON CONFLICT DO NOTHING = race-condition-sicher.
export async function initEnergieausweisBackfill() {
  const { supabase, user } = await getAuthUser()

  // Prüfe ob schon ein Energieausweis-Eintrag existiert
  const { data: existing } = await supabase
    .from('dokumente')
    .select('id')
    .eq('user_id', user.id)
    .eq('dokument_typ', 'energieausweis')
    .maybeSingle()

  if (existing) return // bereits vorhanden

  const { data: listing } = await supabase
    .from('listings')
    .select('id, energieausweis_status, energieausweis_datei_url')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!listing?.energieausweis_status) return

  try {
    await supabase
      .from('dokumente')
      .insert({
        user_id: user.id,
        listing_id: listing.id,
        dokument_typ: 'energieausweis',
        status: listing.energieausweis_status === 'vorhanden' ? 'vorhanden' : 'angefragt',
        datei_url: listing.energieausweis_datei_url ?? null,
      })
      .throwOnError()
  } catch {
    // ON CONFLICT (user_id, dokument_typ) → ignorieren
  }
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

const StatusSchema = z.enum(['fehlt', 'angefragt', 'vorhanden', 'nicht_relevant'])

export async function saveDokumentStatus(
  typ: string,
  status: z.infer<typeof StatusSchema>,
  notiz?: string,
) {
  const { supabase, user } = await getAuthUser()

  StatusSchema.parse(status)
  if (notiz !== undefined && notiz.length > 500) {
    throw new Error('Notiz darf maximal 500 Zeichen lang sein.')
  }

  const { data: listing } = await supabase
    .from('listings')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  await supabase
    .from('dokumente')
    .upsert(
      {
        user_id: user.id,
        listing_id: listing?.id ?? null,
        dokument_typ: typ,
        status,
        ...(notiz !== undefined ? { notiz } : {}),
      },
      { onConflict: 'user_id,dokument_typ' },
    )
    .throwOnError()

  // Sync: wenn energieausweis auf 'vorhanden' gesetzt (ohne Datei-Upload)
  if (typ === 'energieausweis' && listing?.id) {
    const mappedStatus =
      status === 'vorhanden' ? 'vorhanden' :
      status === 'angefragt' ? 'angefragt' :
      'nachzureichen'
    await supabase
      .from('listings')
      .update({ energieausweis_status: mappedStatus })
      .eq('id', listing.id)
      .eq('user_id', user.id)
  }

  revalidatePath('/dashboard/unterlagen')
}

export async function uploadDokument(typ: string, formData: FormData) {
  const { supabase, user } = await getAuthUser()
  const file = formData.get('file') as File | null
  if (!file) throw new Error('Keine Datei übergeben.')

  // Validierung
  const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png']
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Nur PDF, JPG oder PNG erlaubt.')
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Datei darf maximal 10 MB groß sein.')
  }

  // Dokument-ID für Storage-Pfad
  const dokumentId = crypto.randomUUID()
  const safeFilename = sanitizeFilename(file.name)
  const storagePath = `${user.id}/${dokumentId}/${safeFilename}`

  const { error: uploadError } = await supabase.storage
    .from('dokumente')
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (uploadError) throw new Error(`Upload fehlgeschlagen: ${uploadError.message}`)

  const { data: { publicUrl } } = supabase.storage
    .from('dokumente')
    .getPublicUrl(storagePath)

  const { data: listing } = await supabase
    .from('listings')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  await supabase
    .from('dokumente')
    .upsert(
      {
        id: dokumentId,
        user_id: user.id,
        listing_id: listing?.id ?? null,
        dokument_typ: typ,
        status: 'vorhanden',
        datei_url: publicUrl,
        datei_name: file.name,
        datei_groesse_kb: Math.round(file.size / 1024),
        hochgeladen_am: new Date().toISOString(),
      },
      { onConflict: 'user_id,dokument_typ' },
    )
    .throwOnError()

  // Energieausweis-Sync → listings
  if (typ === 'energieausweis' && listing?.id) {
    await supabase
      .from('listings')
      .update({
        energieausweis_status: 'vorhanden',
        energieausweis_datei_url: publicUrl,
      })
      .eq('id', listing.id)
      .eq('user_id', user.id)
  }

  revalidatePath('/dashboard/unterlagen')
  return { dokument_id: dokumentId, datei_url: publicUrl }
}

export async function deleteDokument(dokument_id: string) {
  const { supabase, user } = await getAuthUser()

  const { data: dok } = await supabase
    .from('dokumente')
    .select('datei_url, datei_name, dokument_typ, listing_id')
    .eq('id', dokument_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!dok) throw new Error('Dokument nicht gefunden.')

  // Storage-Datei löschen (best-effort)
  if (dok.datei_url) {
    const url = new URL(dok.datei_url)
    const pathParts = url.pathname.split('/storage/v1/object/public/dokumente/')
    if (pathParts[1]) {
      await supabase.storage.from('dokumente').remove([pathParts[1]])
    }
  }

  // DB: Status zurücksetzen, Datei-Infos löschen, Status ≠ 'fehlt' bleibt
  await supabase
    .from('dokumente')
    .update({
      datei_url: null,
      datei_name: null,
      datei_groesse_kb: null,
      hochgeladen_am: null,
      status: 'fehlt',
    })
    .eq('id', dokument_id)
    .eq('user_id', user.id)
    .throwOnError()

  revalidatePath('/dashboard/unterlagen')
}

// ── Sharing ───────────────────────────────────────────────────────────────────

const ShareSchema = z.object({
  empfaenger_name: z.string().min(1).max(100),
  empfaenger_email: z.string().email().optional().or(z.literal('')),
  dokument_ids: z.array(z.string().uuid()).min(1),
  gueltigkeit_tage: z.number().int().min(1).max(30),
  passwort: z.string().min(4).max(50).optional().or(z.literal('')),
})

export async function createMappeShare(input: z.infer<typeof ShareSchema>) {
  const { supabase, user } = await getAuthUser()
  const parsed = ShareSchema.parse(input)

  const shareToken = crypto.randomBytes(24).toString('base64url')
  const ablaufdatum = new Date()
  ablaufdatum.setDate(ablaufdatum.getDate() + parsed.gueltigkeit_tage)

  let passwort_hash: string | null = null
  if (parsed.passwort && parsed.passwort.length > 0) {
    passwort_hash = await bcrypt.hash(parsed.passwort, 12)
  }

  const { data: listing } = await supabase
    .from('listings')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: share, error } = await supabase
    .from('dokument_shares')
    .insert({
      user_id: user.id,
      listing_id: listing?.id ?? null,
      share_token: shareToken,
      empfaenger_name: parsed.empfaenger_name,
      empfaenger_email: parsed.empfaenger_email || null,
      dokument_ids: parsed.dokument_ids,
      ablaufdatum: ablaufdatum.toISOString(),
      passwort_hash,
    })
    .select('id')
    .single()

  if (error || !share) throw new Error('Share konnte nicht erstellt werden.')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://du-bist-der-makler.de'
  const shareUrl = `${appUrl}/mappe/${shareToken}`

  // E-Mail versenden wenn Adresse angegeben
  if (parsed.empfaenger_email) {
    const { subject, html } = dokumentShareEmail({
      empfaenger_name: parsed.empfaenger_name,
      share_url: shareUrl,
      ablaufdatum: ablaufdatum.toLocaleDateString('de-DE', {
        day: '2-digit', month: 'long', year: 'numeric',
      }),
      passwortgeschuetzt: !!passwort_hash,
    })
    await resend.emails.send({
      from: FROM_SUPPORT,
      to: parsed.empfaenger_email,
      subject,
      html,
    }).catch(() => null) // E-Mail-Fehler blockiert nicht den Share
  }

  revalidatePath('/dashboard/unterlagen')
  return { share_token: shareToken, share_url: shareUrl, share_id: share.id }
}

export async function zurueckziehenMappeShare(share_id: string) {
  const { supabase, user } = await getAuthUser()

  await supabase
    .from('dokument_shares')
    .update({ zurueckgezogen_am: new Date().toISOString() })
    .eq('id', share_id)
    .eq('user_id', user.id)
    .throwOnError()

  revalidatePath('/dashboard/unterlagen')
}
