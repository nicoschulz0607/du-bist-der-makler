import { umsatzTrend } from '@/lib/helios/aggregations/umsatz'
import { aktiveListingsNachTier, inaktiveListings } from '@/lib/helios/aggregations/operations'
import { margeAktuellerMonat } from '@/lib/helios/aggregations/marge'
import { fetchAlleKunden, fetchLetzteBusinessEvents } from '@/lib/helios/sources/supabase'
import { PageWrapper } from '@/lib/helios/components/layout/PageWrapper'
import { SectionGrid } from '@/lib/helios/components/layout/SectionGrid'
import { KPICard } from '@/lib/helios/components/kpi/KPICard'
import { Card } from '@/lib/helios/components/primitives/Card'

const EVENT_LABELS: Record<string, string> = {
  checkout_abgeschlossen:  'Kauf abgeschlossen',
  listing_veröffentlicht:  'Listing veröffentlicht',
  verkauf_abgeschlossen:   'Verkauf abgeschlossen',
  expose_generiert:        'Exposé generiert',
  interessent_eingegangen: 'Interessent eingegangen',
  termin_erstellt:         'Termin erstellt',
  makler_stunde_gebucht:   'Makler-Stunde gebucht',
  paket_upgrade:           'Paket-Upgrade',
  refund_ausgelöst:        'Erstattung ausgelöst',
}

function relativeZeit(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'gerade eben'
  if (min < 60) return `vor ${min} Min`
  const h = Math.floor(min / 60)
  if (h < 24) return `vor ${h} Std`
  return `vor ${Math.floor(h / 24)} Tagen`
}

export default async function HeliosOverviewPage() {
  const [trend, tierMix, inaktiv, kunden, events, marge] = await Promise.all([
    umsatzTrend(),
    aktiveListingsNachTier(),
    inaktiveListings(),
    fetchAlleKunden(),
    fetchLetzteBusinessEvents(20),
    margeAktuellerMonat(),
  ])

  const jetzt = new Date()
  const monatName = jetzt.toLocaleString('de-DE', { month: 'long', year: 'numeric' })

  return (
    <PageWrapper
      title="Übersicht"
      subtitle={`Stand: ${jetzt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
    >
      {/* Hero-Zeile: 4 KPIs */}
      <SectionGrid cols={4}>
        <KPICard
          label={`Umsatz ${monatName}`}
          value={trend.aktuellerMonatCents / 100}
          format="eur"
          trend={{ value: trend.changePercent, label: 'vs. Vormonat' }}
          status={trend.direction === 'up' ? 'positive' : trend.direction === 'down' ? 'negative' : 'neutral'}
        />
        <KPICard
          label="Zahlende Kunden"
          value={kunden.length}
          format="number"
        />
        <KPICard
          label="Aktive Pakete"
          value={tierMix.gesamt}
          format="number"
          suffix={`${tierMix.basic}B · ${tierMix.pro}P · ${tierMix.premium}Pr`}
        />
        <KPICard
          label="Inaktive Listings"
          value={inaktiv.length}
          format="number"
          status={inaktiv.length > 0 ? 'warning' : 'positive'}
          suffix="> 14 Tage"
        />
      </SectionGrid>

      {/* Zweite Zeile: Marge & KI-Kosten ─────────────────────────── */}
      <SectionGrid cols={3} className="mt-4">
        <KPICard
          label={`Rohmarge ${monatName}`}
          value={marge.rohmargeApproxCent / 100}
          format="eur"
          status={marge.rohmargeApproxCent >= 0 ? 'positive' : 'negative'}
        />
        <KPICard
          label={`KI-Kosten ${monatName}`}
          value={marge.aiKostenEurCent / 100}
          format="eur"
          status={marge.aiKostenEurCent > 100 ? 'warning' : 'neutral'}
        />
        <KPICard
          label={`Burn Rate (Fixkosten)`}
          value={marge.fixkostenCent / 100}
          format="eur"
          status="neutral"
          suffix="anteilig Mai"
        />
      </SectionGrid>

      {/* Aktivitäts-Feed */}
      <Card className="mt-6">
        <h2 className="text-sm font-semibold text-helios-text mb-4">Letzte Aktivitäten</h2>

        {events.length === 0 ? (
          <p className="text-sm text-helios-text-muted py-4 text-center">
            Noch keine Events vorhanden — werden nach dem nächsten Kauf erscheinen.
          </p>
        ) : (
          <div className="divide-y divide-helios-border">
            {events.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-helios-accent shrink-0" />
                  <span className="text-sm text-helios-text">
                    {EVENT_LABELS[e.eventName] ?? e.eventName}
                  </span>
                  {e.userId && (
                    <span className="text-xs text-helios-text-subtle hidden sm:block">
                      {e.userId.slice(0, 8)}…
                    </span>
                  )}
                </div>
                <span className="text-xs text-helios-text-subtle shrink-0">
                  {relativeZeit(e.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageWrapper>
  )
}
