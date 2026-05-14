import { createClient } from '@/lib/supabase/server'
import { getKlaraContext } from '@/lib/klara/context'
import { detectTriggerSignals, getPrimarySignal } from '@/lib/klara/triggers'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Nicht eingeloggt', { status: 401 })

  const ctx = await getKlaraContext(user.id)
  const signals = detectTriggerSignals(ctx)
  const primary = getPrimarySignal(ctx)

  return Response.json({
    signals,
    primary,
    ctx_summary: {
      listing_status: ctx.listing?.status,
      listing_tage: ctx.listing?.tage_seit_anlage,
      interessenten_gesamt: ctx.interessenten.gesamt,
      aelteste_unbeantwortet: ctx.interessenten.aelteste_unbeantwortete_anfrage,
      termin_in_stunden: ctx.termine.naechster_in_stunden,
      paket_tage: ctx.user.paket_tage_verbleibend,
      aktivitaet_tage: ctx.aktivitaet.tage_seit_letzter_aktivitaet,
    },
  })
}
