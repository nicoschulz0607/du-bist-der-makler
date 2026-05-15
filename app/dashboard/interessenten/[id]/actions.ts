'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/activity/log'
import { EVENT_TYPES } from '@/lib/activity/types'

export async function markiereBeantwortet(interessentId: string): Promise<{ success: true } | { error: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht eingeloggt' }

    const { data: interessent, error: fetchError } = await supabase
      .from('interessenten')
      .select('id, listing_id, name, antwortet_am')
      .eq('id', interessentId)
      .single()

    if (fetchError || !interessent) return { error: 'Interessent nicht gefunden' }
    if (interessent.antwortet_am) return { error: 'Bereits als beantwortet markiert' }

    const { error: updateError } = await supabase
      .from('interessenten')
      .update({ antwortet_am: new Date().toISOString() })
      .eq('id', interessentId)

    if (updateError) {
      console.error('[markiereBeantwortet] update failed:', updateError)
      return { error: 'Konnte nicht aktualisieren' }
    }

    await logEvent({
      user_id: user.id,
      event_type: EVENT_TYPES.INTERESSENT_BEANTWORTET,
      listing_id: interessent.listing_id ?? null,
      interessent_id: interessentId,
      payload: { name: interessent.name },
      source: 'user',
    })

    revalidatePath(`/dashboard/interessenten/${interessentId}`)
    revalidatePath('/dashboard/interessenten')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (e) {
    console.error('[markiereBeantwortet] failed:', e)
    return { error: 'Unerwarteter Fehler' }
  }
}

export async function widerrufBeantwortet(interessentId: string): Promise<{ success: true } | { error: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht eingeloggt' }

    const { error: updateError } = await supabase
      .from('interessenten')
      .update({ antwortet_am: null })
      .eq('id', interessentId)

    if (updateError) {
      console.error('[widerrufBeantwortet] update failed:', updateError)
      return { error: 'Konnte nicht widerrufen' }
    }

    revalidatePath(`/dashboard/interessenten/${interessentId}`)
    revalidatePath('/dashboard/interessenten')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (e) {
    console.error('[widerrufBeantwortet] failed:', e)
    return { error: 'Unerwarteter Fehler' }
  }
}
