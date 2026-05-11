export type BusinessEvent =
  | 'checkout_abgeschlossen'
  | 'listing_veröffentlicht'
  | 'verkauf_abgeschlossen'
  | 'expose_generiert'
  | 'interessent_eingegangen'
  | 'termin_erstellt'
  | 'makler_stunde_gebucht'
  | 'paket_upgrade'
  | 'refund_ausgelöst'

export type WebEvent =
  | 'landing_viewed'
  | 'hero_cta_clicked'
  | 'pricing_paket_hovered'
  | 'faq_geöffnet'
  | 'chatbot_geöffnet'
  | 'preisrechner_genutzt'

// Sprint 3: PostHog client SDK hier einklinken
export function trackWeb(_event: WebEvent, _props: Record<string, unknown>): void {}

export async function trackBusiness(
  event: BusinessEvent,
  props: { user_id?: string; listing_id?: string; [k: string]: unknown }
): Promise<void> {
  try {
    const { createServiceClient } = await import('@/lib/supabase/service')
    const service = createServiceClient()
    const { user_id, listing_id, ...rest } = props
    await service.from('business_events').insert({
      event_name: event,
      user_id: user_id ?? null,
      listing_id: listing_id ?? null,
      properties: rest,
    })
  } catch {
    // Tracking-Fehler darf Business-Logik nie unterbrechen
  }
}
