'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import type {
  ActivityEvent,
  LogEventInput,
  GetRecentEventsOptions,
} from './types'

export async function logEvent(input: LogEventInput): Promise<void> {
  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from('activity_log').insert({
      user_id: input.user_id,
      listing_id: input.listing_id ?? null,
      event_type: input.event_type,
      interessent_id: input.interessent_id ?? null,
      termin_id: input.termin_id ?? null,
      dokument_id: input.dokument_id ?? null,
      payload: input.payload ?? {},
      source: input.source ?? 'user',
      user_sichtbar: input.user_sichtbar ?? true,
    })

    if (error) {
      console.error('[activity-log] Insert failed:', error.message, {
        event_type: input.event_type,
        user_id: input.user_id,
      })
    }
  } catch (e) {
    console.error('[activity-log] Unexpected error:', e)
  }
}

export async function getRecentEvents(
  user_id: string,
  options: GetRecentEventsOptions = {}
): Promise<ActivityEvent[]> {
  const supabase = await createClient()
  let query = supabase
    .from('activity_log')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 20)

  if (options.listing_id) {
    query = query.eq('listing_id', options.listing_id)
  }

  if (options.types && options.types.length > 0) {
    query = query.in('event_type', options.types)
  }

  const { data, error } = await query

  if (error) {
    console.error('[activity-log] Read failed:', error.message)
    return []
  }

  return (data ?? []) as ActivityEvent[]
}
