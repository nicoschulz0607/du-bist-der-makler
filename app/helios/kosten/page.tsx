import { getMargeZeitraum } from '@/lib/helios/aggregations/marge'
import {
  kostenProTag,
  kostenProProvider,
  kostenProCallSite,
  kostenNachTier,
  getMonatlicheBurnRate,
} from '@/lib/helios/aggregations/kosten'
import { PageWrapper }  from '@/lib/helios/components/layout/PageWrapper'
import { SectionGrid }  from '@/lib/helios/components/layout/SectionGrid'
import { ZeitraumTabs } from '@/lib/helios/components/layout/ZeitraumTabs'
import { KPICard }      from '@/lib/helios/components/kpi/KPICard'
import { ChartCard }    from '@/lib/helios/components/charts/ChartCard'
import { AreaChart }    from '@/lib/helios/components/charts/AreaChart'
import { BarChart }     from '@/lib/helios/components/charts/BarChart'
import { DonutChart }   from '@/lib/helios/components/charts/DonutChart'
import { formatCents, shortCallSite } from '@/lib/helios/utils/format'
// formatCents is used inline in the server-rendered call-sites list.
// Chart format props use string discriminators ('eur', 'date-short') so no
// function references cross the Server→Client boundary.

export default async function KostenPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const tage = Math.max(7, Math.min(90, parseInt(String(params.tage ?? '30'), 10) || 30))

  const bis = new Date()
  const von = new Date(bis.getTime() - tage * 86400_000)
  const zeitraum = { von: von.toISOString(), bis: bis.toISOString() }

  const [marge, proTag, proProvider, proCallSite, nachTier, burnRate] = await Promise.all([
    getMargeZeitraum(zeitraum),
    kostenProTag(zeitraum),
    kostenProProvider(zeitraum),
    kostenProCallSite(zeitraum),
    kostenNachTier(zeitraum),
    getMonatlicheBurnRate(),
  ])

  const providerData = [
    { provider: 'Anthropic', kosten_cent: proProvider.anthropic },
    { provider: 'fal.ai',    kosten_cent: proProvider.fal },
    { provider: 'Replicate', kosten_cent: proProvider.replicate },
  ]

  const callSiteTop5 = Object.entries(proCallSite).slice(0, 5)

  const tierData = Object.entries(nachTier)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))

  const isProfit = marge.rohmargeApproxCent >= 0

  return (
    <PageWrapper
      title="KI-Kosten & Marge"
      subtitle={`${von.toLocaleDateString('de-DE')} – ${bis.toLocaleDateString('de-DE')}`}
      actions={<ZeitraumTabs pathname="/helios/kosten" active={String(tage)} />}
    >
      {/* ── Row 1: Hero KPIs ──────────────────────────────────────────── */}
      <SectionGrid cols={4}>
        <KPICard
          label="Umsatz (Zeitraum)"
          value={marge.umsatzCent / 100}
          format="eur"
          status="neutral"
        />
        <KPICard
          label="KI-Kosten (EUR)"
          value={marge.aiKostenEurCent / 100}
          format="eur"
          status={marge.aiKostenEurCent > 100 ? 'warning' : 'neutral'}
        />
        <KPICard
          label="Fixkosten (anteilig)"
          value={marge.fixkostenCent / 100}
          format="eur"
          status="neutral"
          suffix={`${tage} Tage`}
        />
        <KPICard
          label={`Rohmarge (${tage} Tage)`}
          value={marge.rohmargeApproxCent / 100}
          format="eur"
          status={isProfit ? 'positive' : 'negative'}
        />
      </SectionGrid>

      {/* ── Row 2: Burn Rate + Provider Breakdown ─────────────────────── */}
      <SectionGrid cols={3} className="mt-4">
        <KPICard
          label="Monatl. Fixkosten (aktuell)"
          value={burnRate / 100}
          format="eur"
          status="neutral"
          suffix="/ Monat fix"
        />
        <KPICard
          label="Affiliate-Einnahmen"
          value={marge.affiliateEinnahmenCent / 100}
          format="eur"
          status={marge.affiliateEinnahmenCent > 0 ? 'positive' : 'neutral'}
        />
        {/* Padding card to keep grid aligned */}
        <div className="bg-helios-surface border border-helios-border rounded-xl p-5 flex flex-col gap-1">
          <p className="text-xs font-medium text-helios-text-muted uppercase tracking-wide">
            Marge-Formel
          </p>
          <p className="text-xs text-helios-text-muted mt-1">
            Umsatz + Affiliate − KI-Kosten − Fixkosten (anteilig) = Rohmarge
          </p>
          <p className="text-xs text-helios-text-subtle mt-1">
            Alle Werte in EUR · KI-Kosten USD→EUR @ 0,92
          </p>
        </div>
      </SectionGrid>

      {/* ── Row 3: Kosten pro Tag (AreaChart) + Provider (BarChart) ───── */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChartCard
            title="KI-Kosten pro Tag"
            subtitle={`${tage}-Tage-Verlauf in EUR-Cent`}
          >
            <AreaChart
              data={proTag as unknown as Record<string, unknown>[]}
              xKey="datum"
              yKey="kosten_cent"
              height={220}
              formatY="eur"
              formatX="date-short"
            />
          </ChartCard>
        </div>
        <div>
          <ChartCard title="Kosten pro Provider" subtitle="Gesamt im Zeitraum">
            <BarChart
              data={providerData}
              xKey="provider"
              yKey="kosten_cent"
              height={220}
              formatY="eur"
            />
          </ChartCard>
        </div>
      </div>

      {/* ── Row 4: Tier-Donut + Call-Sites ────────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <ChartCard title="Kosten nach Paket" subtitle="Historisches Paket-Mapping">
            <DonutChart
              data={tierData}
              height={220}
              formatValue="eur"
            />
          </ChartCard>
        </div>
        <div className="lg:col-span-2">
          <ChartCard
            title="Top Call-Sites"
            subtitle="Teuerste API-Endpunkte im Zeitraum"
          >
            {callSiteTop5.length === 0 ? (
              <p className="text-xs text-helios-text-subtle py-8 text-center">
                Noch keine KI-Calls im Zeitraum
              </p>
            ) : (
              <div className="divide-y divide-helios-border">
                {callSiteTop5.map(([site, cents]) => (
                  <div key={site} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-helios-text font-mono text-xs">
                      {shortCallSite(site)}
                    </span>
                    <span className="text-sm font-medium text-helios-text tabular-nums">
                      {formatCents(cents)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>
      </div>
    </PageWrapper>
  )
}
