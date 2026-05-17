'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface SaveData {
  name?: string
  email?: string
  telefon?: string
  status?: string
  bonitaet?: string
  bonitaet_notiz?: string
  bankbestaetigung?: boolean
  abgegebenes_angebot?: string | number
  altersgruppe?: string
  beruf?: string
  wohnsituation_aktuell?: string
  finanzierung_status?: string
  zeithorizont?: string
}

export async function saveInteressent(interessentId: string, data: SaveData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht eingeloggt' }

    if (!data.name?.trim()) return { error: 'Name ist Pflicht' }

    // Alten Wert laden um Angebot-Änderung zu erkennen
    const { data: old, error: oldError } = await supabase
      .from('interessenten')
      .select('abgegebenes_angebot, bonitaet, bonitaet_notiz, bankbestaetigung, listing_id')
      .eq('id', interessentId)
      .single()

    if (oldError) console.error('[saveInteressent] old select:', oldError.message)

    const neuesAngebot = data.abgegebenes_angebot ? Number(data.abgegebenes_angebot) : null
    const altesAngebot = old?.abgegebenes_angebot ?? null

    const updates: Record<string, unknown> = {
      name: data.name.trim(),
      email: data.email || null,
      telefon: data.telefon || null,
      status: data.status || 'neu',
      bonitaet: data.bonitaet || null,
      bonitaet_notiz: data.bonitaet_notiz || null,
      bankbestaetigung: data.bankbestaetigung ?? false,
      abgegebenes_angebot: neuesAngebot,
      altersgruppe: data.altersgruppe || null,
      beruf: data.beruf || null,
      wohnsituation_aktuell: data.wohnsituation_aktuell || null,
      finanzierung_status: data.finanzierung_status || null,
      zeithorizont: data.zeithorizont || null,
    }

    if (data.bonitaet) {
      updates.bonitaet_geprueft_am = new Date().toISOString()
    }

    // Angebot-Änderung → History-Eintrag
    if (neuesAngebot && neuesAngebot !== altesAngebot && old?.listing_id) {
      const { error: histError } = await supabase.from('angebots_historie').insert({
        interessent_id: interessentId,
        listing_id: old.listing_id,
        betrag: neuesAngebot,
        bonitaet_snapshot: old.bonitaet ?? null,
        bonitaet_notiz_snapshot: old.bonitaet_notiz ?? null,
        bankbestaetigung_snapshot: old.bankbestaetigung ?? false,
      })
      if (histError) console.error('[saveInteressent] history insert:', histError.message)
    }

    const { error } = await supabase
      .from('interessenten')
      .update(updates)
      .eq('id', interessentId)

    if (error) {
      console.error('[saveInteressent]', error)
      return { error: 'Konnte nicht speichern' }
    }

    revalidatePath('/dashboard/interessenten')
    return { success: true }
  } catch (e) {
    console.error('[saveInteressent] failed:', e)
    return { error: 'Unerwarteter Fehler' }
  }
}

export async function createAngebot(
  interessentId: string,
  betrag: number,
  kommentar?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Nicht eingeloggt' }

    if (!betrag || betrag <= 0) return { ok: false, error: 'Betrag muss größer als 0 sein' }

    const { data: int } = await supabase
      .from('interessenten')
      .select('listing_id, bonitaet, bonitaet_notiz, bankbestaetigung, listings!inner(user_id)')
      .eq('id', interessentId)
      .single()

    if (!int) return { ok: false, error: 'Interessent nicht gefunden' }

    const listing = (int as any).listings
    if (!listing || listing.user_id !== user.id) return { ok: false, error: 'Kein Zugriff' }

    // Snapshot + History-Eintrag
    const { error: insertError } = await supabase.from('angebots_historie').insert({
      interessent_id: interessentId,
      listing_id: int.listing_id,
      betrag,
      kommentar: kommentar || null,
      bonitaet_snapshot: int.bonitaet ?? null,
      bonitaet_notiz_snapshot: int.bonitaet_notiz ?? null,
      bankbestaetigung_snapshot: int.bankbestaetigung ?? false,
    })

    if (insertError) {
      console.error('[createAngebot] insert', insertError)
      return { ok: false, error: 'Konnte Angebot nicht speichern' }
    }

    // abgegebenes_angebot auf neuen Wert setzen
    const { error: updateError } = await supabase
      .from('interessenten')
      .update({ abgegebenes_angebot: betrag })
      .eq('id', interessentId)

    if (updateError) {
      console.error('[createAngebot] update', updateError)
      return { ok: false, error: 'Angebot gespeichert, aber Interessent nicht aktualisiert' }
    }

    revalidatePath('/dashboard/interessenten')
    return { ok: true }
  } catch (e) {
    console.error('[createAngebot] failed:', e)
    return { ok: false, error: 'Unerwarteter Fehler' }
  }
}

export async function getAngeboteHistorie(
  interessentId: string
): Promise<{ ok: boolean; data?: AngebotHistorieEintrag[]; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Nicht eingeloggt' }

    const { data, error } = await supabase
      .from('angebots_historie')
      .select('id, betrag, kommentar, bonitaet_snapshot, bonitaet_notiz_snapshot, bankbestaetigung_snapshot, erstellt_am')
      .eq('interessent_id', interessentId)
      .order('erstellt_am', { ascending: false })

    if (error) return { ok: false, error: 'Konnte Historie nicht laden' }

    return { ok: true, data: data as AngebotHistorieEintrag[] }
  } catch (e) {
    console.error('[getAngeboteHistorie] failed:', e)
    return { ok: false, error: 'Unerwarteter Fehler' }
  }
}

export interface AngebotHistorieEintrag {
  id: string
  betrag: number
  kommentar: string | null
  bonitaet_snapshot: string | null
  bonitaet_notiz_snapshot: string | null
  bankbestaetigung_snapshot: boolean
  erstellt_am: string
}
