'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export type ShareValidierungsResult =
  | {
      ok: true
      share_id: string
      empfaenger_name: string
      dokument_ids: string[]
      ablaufdatum: string
    }
  | { ok: false; fehler: 'ungueltig' | 'abgelaufen' | 'zurueckgezogen' | 'falsches_passwort' }

export async function validiereShareToken(
  token: string,
  passwort?: string,
): Promise<ShareValidierungsResult> {
  if (!token || token.length < 10) return { ok: false, fehler: 'ungueltig' }

  const service = getServiceClient()
  const { data: share } = await service
    .from('dokument_shares')
    .select('id, empfaenger_name, dokument_ids, ablaufdatum, passwort_hash, zurueckgezogen_am, abgerufen_am')
    .eq('share_token', token)
    .maybeSingle()

  if (!share) return { ok: false, fehler: 'ungueltig' }
  if (share.zurueckgezogen_am) return { ok: false, fehler: 'zurueckgezogen' }
  if (new Date(share.ablaufdatum) < new Date()) return { ok: false, fehler: 'abgelaufen' }

  if (share.passwort_hash) {
    if (!passwort) return { ok: false, fehler: 'falsches_passwort' }
    const valid = await bcrypt.compare(passwort, share.passwort_hash)
    if (!valid) return { ok: false, fehler: 'falsches_passwort' }
  }

  // Audit-Trail: Zugriff protokollieren
  const abgerufen = [...((share.abgerufen_am as string[]) ?? []), new Date().toISOString()]
  try {
    await service
      .from('dokument_shares')
      .update({ abgerufen_am: abgerufen })
      .eq('id', share.id)
      .throwOnError()
  } catch {
    // best-effort audit
  }

  return {
    ok: true,
    share_id: share.id,
    empfaenger_name: share.empfaenger_name,
    dokument_ids: share.dokument_ids as string[],
    ablaufdatum: share.ablaufdatum,
  }
}

export async function getSignedUrlForDokument(
  token: string,
  dokument_id: string,
): Promise<{ url: string } | { fehler: string }> {
  // Re-Validierung bei jedem Download-Request (ohne Passwort-Pflicht nach erstem Login)
  const service = getServiceClient()

  const { data: share } = await service
    .from('dokument_shares')
    .select('dokument_ids, ablaufdatum, zurueckgezogen_am')
    .eq('share_token', token)
    .maybeSingle()

  if (!share) return { fehler: 'Ungültiger Link.' }
  if (share.zurueckgezogen_am) return { fehler: 'Diese Mappe wurde zurückgezogen.' }
  if (new Date(share.ablaufdatum) < new Date()) return { fehler: 'Dieser Link ist abgelaufen.' }

  const ids = share.dokument_ids as string[]
  if (!ids.includes(dokument_id)) return { fehler: 'Dieses Dokument ist nicht in der Mappe.' }

  const { data: dok } = await service
    .from('dokumente')
    .select('datei_url')
    .eq('id', dokument_id)
    .maybeSingle()

  if (!dok?.datei_url) return { fehler: 'Datei nicht gefunden.' }

  // Pfad aus der public URL extrahieren für Signed URL
  const url = new URL(dok.datei_url)
  const match = url.pathname.match(/\/storage\/v1\/object\/public\/dokumente\/(.+)/)
  if (!match) return { fehler: 'Ungültiger Dateipfad.' }

  const { data: signed, error } = await service.storage
    .from('dokumente')
    .createSignedUrl(match[1], 60 * 60 * 24) // 24h gültig

  if (error || !signed) return { fehler: 'Signierte URL konnte nicht erstellt werden.' }
  return { url: signed.signedUrl }
}
