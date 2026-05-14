import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { validiereShareToken } from './actions'
import PasswordGate from './PasswordGate'
import MappeContent from './MappeContent'
import { redirect } from 'next/navigation'
import { logEvent } from '@/lib/activity/log'
import { EVENT_TYPES } from '@/lib/activity/types'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function cookieName(token: string) {
  return `mappe_auth_${token.slice(0, 16)}`
}

async function getJwtSecret() {
  const secret = process.env.MAPPE_JWT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'fallback-secret-change-me'
  return new TextEncoder().encode(secret)
}

// Server Action: Passwort prüfen, JWT-Cookie setzen, redirect
async function validatePassword(token: string, passwort: string): Promise<{ fehler?: string }> {
  'use server'
  const result = await validiereShareToken(token, passwort)
  if (!result.ok) {
    return { fehler: 'falsches_passwort' }
  }

  const secret = await getJwtSecret()
  const jwt = await new SignJWT({ token })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(secret)

  const cookieStore = await cookies()
  cookieStore.set(cookieName(token), jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8h
    path: `/mappe/${token}`,
  })

  redirect(`/mappe/${token}`)
}

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function MappePage({ params }: PageProps) {
  const { token } = await params

  // 1. Token basic-validierung (ohne Passwort) — ermittelt ob Mappe existiert und gültig ist
  const service = getServiceClient()
  const { data: share } = await service
    .from('dokument_shares')
    .select('id, user_id, empfaenger_name, dokument_ids, ablaufdatum, passwort_hash, zurueckgezogen_am')
    .eq('share_token', token)
    .maybeSingle()

  // Fehlerseite: Token ungültig, abgelaufen oder zurückgezogen
  if (!share) {
    return <FehlerSeite reason="ungueltig" />
  }
  if (share.zurueckgezogen_am) {
    return <FehlerSeite reason="zurueckgezogen" />
  }
  if (new Date(share.ablaufdatum) < new Date()) {
    return <FehlerSeite reason="abgelaufen" />
  }

  // 2. Passwort-Gate: prüfen ob Cookie vorhanden und gültig
  if (share.passwort_hash) {
    const cookieStore = await cookies()
    const jwtCookie = cookieStore.get(cookieName(token))?.value
    let authOk = false

    if (jwtCookie) {
      try {
        const secret = await getJwtSecret()
        const { payload } = await jwtVerify(jwtCookie, secret)
        authOk = payload.token === token
      } catch {
        authOk = false
      }
    }

    if (!authOk) {
      return (
        <PasswordGate
          token={token}
          action={validatePassword}
        />
      )
    }
  }

  // 3. Dokumente laden und Audit-Trail aktualisieren
  const dokumentIds = share.dokument_ids as string[]
  const { data: dbDokumente } = await service
    .from('dokumente')
    .select('id, dokument_typ, datei_name, datei_groesse_kb')
    .in('id', dokumentIds)

  // Audit: Zugriff protokollieren (nur wenn kein Passwort oder bereits validiert)
  const { data: currentShare } = await service
    .from('dokument_shares')
    .select('abgerufen_am')
    .eq('id', share.id)
    .single()

  if (currentShare) {
    const arr: string[] = currentShare.abgerufen_am ?? []
    arr.push(new Date().toISOString())
    try {
      await service
        .from('dokument_shares')
        .update({ abgerufen_am: arr })
        .eq('id', share.id)
        .throwOnError()
    } catch {
      // best-effort audit
    }
  }

  await logEvent({
    user_id: share.user_id,
    event_type: EVENT_TYPES.MAPPE_ABGERUFEN,
    payload: {
      share_id: share.id,
      empfaenger_name: share.empfaenger_name,
    },
    source: 'system',
    user_sichtbar: true,
  })

  // Katalog-Namen für Dokument-Typen laden
  const { DOKUMENT_KATALOG } = await import('@/lib/dokumente/katalog')
  const katalogByTyp = new Map(DOKUMENT_KATALOG.map((d) => [d.typ, d]))

  const dokumente = (dbDokumente ?? []).map((dok) => ({
    id: dok.id,
    typ: dok.dokument_typ,
    name: katalogByTyp.get(dok.dokument_typ)?.name ?? dok.dokument_typ,
    datei_name: dok.datei_name,
    datei_groesse_kb: dok.datei_groesse_kb,
  }))

  return (
    <MappeContent
      token={token}
      empfaengerName={share.empfaenger_name}
      ablaufdatum={share.ablaufdatum}
      dokumente={dokumente}
    />
  )
}

function FehlerSeite({ reason }: { reason: 'ungueltig' | 'abgelaufen' | 'zurueckgezogen' }) {
  const MESSAGES = {
    ungueltig: {
      title: 'Mappe nicht gefunden',
      text: 'Dieser Link existiert nicht oder ist ungültig. Bitte frage beim Absender nach einem neuen Link.',
    },
    abgelaufen: {
      title: 'Mappe abgelaufen',
      text: 'Dieser Link ist nicht mehr gültig. Bitte frage beim Verkäufer nach einem neuen Link.',
    },
    zurueckgezogen: {
      title: 'Mappe nicht mehr verfügbar',
      text: 'Diese Dokumente-Mappe wurde vom Verkäufer zurückgezogen.',
    },
  }

  const { title, text } = MESSAGES[reason]

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-[#EEEEEE] p-8 w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📄</span>
        </div>
        <h1 className="text-[18px] font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-[13px] text-gray-500 leading-relaxed">{text}</p>
        <a
          href="https://du-bist-der-makler.de"
          className="mt-6 inline-block text-[12px] text-[#1B6B45] hover:underline"
        >
          du-bist-der-makler.de
        </a>
      </div>
    </div>
  )
}
