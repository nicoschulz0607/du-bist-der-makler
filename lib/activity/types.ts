export const EVENT_TYPES = {
  WIZARD_STATION_COMPLETED:     'wizard_station_completed',
  WIZARD_STATION_SKIPPED:       'wizard_station_skipped',
  LISTING_VEROEFFENTLICHT:      'listing_veroeffentlicht',
  INTERESSENT_ANGELEGT:         'interessent_angelegt',
  INTERESSENT_STATUS_GEAENDERT: 'interessent_status_geaendert',
  TERMIN_GEPLANT:               'termin_geplant',
  DOKUMENT_HOCHGELADEN:         'dokument_hochgeladen',
  MAPPE_GETEILT:                'mappe_geteilt',
  MAPPE_ABGERUFEN:              'mappe_abgerufen',
  INTERESSENT_BEANTWORTET:      'interessent_beantwortet',
} as const

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES]

export type EventSource = 'user' | 'system' | 'klara' | 'admin' | 'cron'

export type EventPayload = Record<string, unknown>

export interface ActivityEvent {
  id: string
  user_id: string
  listing_id: string | null
  event_type: EventType
  interessent_id: string | null
  termin_id: string | null
  dokument_id: string | null
  payload: EventPayload
  source: EventSource
  user_sichtbar: boolean
  created_at: string
}

export interface LogEventInput {
  event_type: EventType
  user_id: string
  listing_id?: string | null
  interessent_id?: string | null
  termin_id?: string | null
  dokument_id?: string | null
  payload?: EventPayload
  source?: EventSource
  user_sichtbar?: boolean
}

export interface GetRecentEventsOptions {
  listing_id?: string
  limit?: number
  types?: EventType[]
}
