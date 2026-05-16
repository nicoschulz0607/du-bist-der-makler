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

    const updates: Record<string, unknown> = {
      name: data.name.trim(),
      email: data.email || null,
      telefon: data.telefon || null,
      status: data.status || 'neu',
      bonitaet: data.bonitaet || null,
      bonitaet_notiz: data.bonitaet_notiz || null,
      abgegebenes_angebot: data.abgegebenes_angebot ? Number(data.abgegebenes_angebot) : null,
      altersgruppe: data.altersgruppe || null,
      beruf: data.beruf || null,
      wohnsituation_aktuell: data.wohnsituation_aktuell || null,
      finanzierung_status: data.finanzierung_status || null,
      zeithorizont: data.zeithorizont || null,
    }

    if (data.bonitaet) {
      updates.bonitaet_geprueft_am = new Date().toISOString()
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
