import { fetchAlleKunden } from '@/lib/helios/sources/supabase'
import { getKlaraContext } from '@/lib/klara/context'
import { detectTriggerSignals, getPrimarySignal } from '@/lib/klara/triggers'
import { PageWrapper } from '@/lib/helios/components/layout/PageWrapper'
import { TriggerDebugIsland } from './TriggerDebugIsland'

export default async function TriggerDebugPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>
}) {
  const { userId } = await searchParams
  const kunden = await fetchAlleKunden()

  let triggerData: {
    signals: ReturnType<typeof detectTriggerSignals>
    primary: ReturnType<typeof getPrimarySignal>
    ctxSummary: {
      listing_status: string | null
      listing_tage: number | null
      interessenten_gesamt: number
      aelteste_unbeantwortet: { name: string; wartet_seit_stunden: number } | null
      termin_in_stunden: number | null
      paket_tage: number | null
      aktivitaet_tage: number | null
    }
  } | null = null

  if (userId) {
    const ctx = await getKlaraContext(userId)
    const signals = detectTriggerSignals(ctx)
    const primary = getPrimarySignal(ctx)
    triggerData = {
      signals,
      primary,
      ctxSummary: {
        listing_status: ctx.listing?.status ?? null,
        listing_tage: ctx.listing?.tage_seit_anlage ?? null,
        interessenten_gesamt: ctx.interessenten.gesamt,
        aelteste_unbeantwortet: ctx.interessenten.aelteste_unbeantwortete_anfrage
          ? {
              name: ctx.interessenten.aelteste_unbeantwortete_anfrage.name,
              wartet_seit_stunden: ctx.interessenten.aelteste_unbeantwortete_anfrage.wartet_seit_stunden,
            }
          : null,
        termin_in_stunden: ctx.termine.naechster_in_stunden,
        paket_tage: ctx.user.paket_tage_verbleibend,
        aktivitaet_tage: ctx.aktivitaet.tage_seit_letzter_aktivitaet,
      },
    }
  }

  return (
    <PageWrapper
      title="Trigger-Debug"
      subtitle={`${kunden.length} Kunden — Klara-Trigger-Signale pro User`}
    >
      <TriggerDebugIsland
        kunden={kunden}
        selectedUserId={userId ?? null}
        triggerData={triggerData}
      />
    </PageWrapper>
  )
}
