// Custom HTML-Bars statt recharts FunnelChart:
// recharts FunnelChart ist begrenzt anpassbar bei Conversion-Labels und Stage-Spacing.
// Custom-Bars sind flexibler und kompatibel mit unserem ChartTheme/Token-System.

import { getConversionDaten } from '@/lib/helios/aggregations/conversion'
import { PageWrapper }  from '@/lib/helios/components/layout/PageWrapper'
import { SectionGrid }  from '@/lib/helios/components/layout/SectionGrid'
import { ZeitraumTabs } from '@/lib/helios/components/layout/ZeitraumTabs'
import { KPICard }      from '@/lib/helios/components/kpi/KPICard'
import { ChartCard }    from '@/lib/helios/components/charts/ChartCard'
import { EmptyState }   from '@/lib/helios/components/feedback/EmptyState'
import { formatPercent } from '@/lib/helios/utils/format'

export default async function FunnelPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const tage = Math.max(7, Math.min(90, parseInt(String(params.tage ?? '30'), 10) || 30))

  const daten = await getConversionDaten(tage)

  const postHogLeer = daten.conversionRate === null && daten.funnel.total_conversions === null

  return (
    <PageWrapper
      title="Funnel & Conversion"
      subtitle={`Letzte ${tage} Tage`}
      actions={<ZeitraumTabs pathname="/helios/funnel" active={String(tage)} />}
    >
      {/* ── Row 1: KPI-Karten ────────────────────────────────────────── */}
      <SectionGrid cols={3}>
        <KPICard
          label="Conversion Rate"
          value={daten.conversionRate ?? 0}
          format="percent"
          status={
            daten.conversionRate === null ? 'neutral' :
            daten.conversionRate >= 2 ? 'positive' : 'warning'
          }
          suffix={daten.conversionRate === null ? '— keine Daten' : undefined}
        />
        <KPICard
          label="Käufe (Zeitraum)"
          value={daten.funnel.total_conversions ?? 0}
          format="number"
          status="neutral"
          suffix={daten.funnel.total_conversions === null ? '— keine Daten' : undefined}
        />
        <KPICard
          label="UTM-Quellen"
          value={daten.topUtmQuellen.length}
          format="number"
          status="neutral"
          suffix="getrackte Quellen"
        />
      </SectionGrid>

      {/* ── Row 2: Funnel-Visualisierung ─────────────────────────────── */}
      <ChartCard
        title="Conversion-Funnel"
        subtitle={`Landing → Kauf · ${tage} Tage`}
        className="mt-4"
      >
        {postHogLeer ? (
          <EmptyState
            title="PostHog noch nicht konfiguriert"
            description="Sobald POSTHOG_PERSONAL_API_KEY in Vercel hinterlegt ist und erste Besucher getrackt werden, erscheint der Funnel hier automatisch."
          />
        ) : (
          <FunnelBars
            stages={daten.funnel.stages}
            firstCount={daten.funnel.stages[0]?.count ?? 1}
          />
        )}
      </ChartCard>

      {/* ── Row 3: UTM-Quellen ───────────────────────────────────────── */}
      <ChartCard
        title="Top UTM-Quellen"
        subtitle={`Letzte ${tage} Tage`}
        className="mt-4"
      >
        {daten.topUtmQuellen.length === 0 ? (
          <EmptyState
            title="Keine UTM-Daten"
            description="UTM-Tracking wird aktiv sobald erste Kampagnen mit utm_source-Parametern aufgerufen werden."
          />
        ) : (
          <div className="divide-y divide-helios-border">
            <div className="grid grid-cols-3 gap-4 pb-2">
              <span className="text-xs font-semibold text-helios-text-muted uppercase tracking-wide">Quelle</span>
              <span className="text-xs font-semibold text-helios-text-muted uppercase tracking-wide text-right">Besucher</span>
              <span className="text-xs font-semibold text-helios-text-muted uppercase tracking-wide text-right">Conversions</span>
            </div>
            {daten.topUtmQuellen.map((q, i) => (
              <div key={i} className="grid grid-cols-3 gap-4 py-2.5 items-center">
                <span className="text-sm text-helios-text font-medium truncate">{q.quelle}</span>
                <span className="text-sm text-helios-text text-right tabular-nums">{q.besucher.toLocaleString('de-DE')}</span>
                <span className="text-sm text-helios-text text-right tabular-nums">{q.conversions}</span>
              </div>
            ))}
          </div>
        )}
      </ChartCard>
    </PageWrapper>
  )
}

// ── Custom Funnel Bar Component ───────────────────────────────────────────────
// Pure Server Component — no Recharts, no 'use client'.
// Each stage is a horizontal bar whose width is proportional to the first stage count.

interface FunnelBarsProps {
  stages: Array<{
    name: string
    count: number
    conversionFromPrev: number | null
  }>
  firstCount: number
}

function FunnelBars({ stages, firstCount }: FunnelBarsProps) {
  if (stages.length === 0) return null

  return (
    <div className="flex flex-col gap-3 py-2">
      {stages.map((stage, i) => {
        const widthPct = firstCount > 0 ? (stage.count / firstCount) * 100 : 100
        return (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-helios-text font-medium">{stage.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-helios-text font-semibold tabular-nums">
                  {stage.count.toLocaleString('de-DE')}
                </span>
                {stage.conversionFromPrev !== null && (
                  <span
                    className={`text-xs font-medium ${
                      stage.conversionFromPrev >= 50
                        ? 'text-helios-success'
                        : stage.conversionFromPrev >= 20
                        ? 'text-helios-warning'
                        : 'text-helios-danger'
                    }`}
                  >
                    {formatPercent(stage.conversionFromPrev)} vom Vorschritt
                  </span>
                )}
              </div>
            </div>
            <div className="h-7 bg-helios-surface-muted rounded-md overflow-hidden">
              <div
                className="h-full bg-helios-accent rounded-md transition-all"
                style={{ width: `${Math.max(widthPct, 2)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
