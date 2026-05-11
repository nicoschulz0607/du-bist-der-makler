import { getOperationsDaten } from '@/lib/helios/aggregations/operations'
import { PageWrapper }  from '@/lib/helios/components/layout/PageWrapper'
import { SectionGrid }  from '@/lib/helios/components/layout/SectionGrid'
import { KPICard }      from '@/lib/helios/components/kpi/KPICard'
import { ChartCard }    from '@/lib/helios/components/charts/ChartCard'
import { LineChart }    from '@/lib/helios/components/charts/LineChart'
import { DataTable }    from '@/lib/helios/components/tables/DataTable'
import type { ColumnDef } from '@/lib/helios/components/tables/DataTable'
import { Badge }        from '@/lib/helios/components/primitives/Badge'
import { EmptyState }   from '@/lib/helios/components/feedback/EmptyState'
import type { HeliosListing, HeliosMaklerTermin } from '@/lib/helios/sources/supabase'
import { CalendarDays } from 'lucide-react'

function tageInaktiv(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}

function themaLabel(thema: string): string {
  const map: Record<string, string> = {
    preisverhandlung: 'Preisverhandlung',
    vertragsfragen:   'Vertragsfragen',
    besichtigung:     'Besichtigung',
    sonstiges:        'Sonstiges',
  }
  return map[thema] ?? thema
}

const INAKTIV_COLUMNS: ColumnDef<HeliosListing>[] = [
  {
    key: 'objekt',
    header: 'Objekt / Ort',
    render: (l) => (
      <div>
        <p className="font-medium text-helios-text">{l.objekttyp ?? 'Immobilie'}</p>
        {l.adresseOrt && (
          <p className="text-xs text-helios-text-muted mt-0.5">{l.adresseOrt}</p>
        )}
      </div>
    ),
  },
  {
    key: 'seller',
    header: 'Verkäufer',
    render: (l) => <span className="text-sm text-helios-text-muted">{l.userEmail ?? '—'}</span>,
  },
  {
    key: 'immoScout',
    header: 'ImmoScout',
    render: (l) => (
      <Badge variant={l.immoscoutStatus === 'Veröffentlicht' ? 'success' : 'neutral'}>
        {l.immoscoutStatus ?? '—'}
      </Badge>
    ),
  },
  {
    key: 'inaktivSeit',
    header: 'Inaktiv seit',
    align: 'right',
    render: (l) => {
      const tage = tageInaktiv(l.updatedAt)
      return (
        <span className={tage > 30 ? 'text-helios-danger font-medium' : 'text-helios-warning font-medium'}>
          {tage} Tage
        </span>
      )
    },
  },
]

export default async function OperationsPage() {
  const ops = await getOperationsDaten()

  const {
    anfragenDaten, anfragenLetzt7Tage,
    immoScoutAktiv, immoScoutKapazitaet,
    inaktiveListings, upcomingTermine,
  } = ops

  const immoScoutPercent = Math.round((immoScoutAktiv / immoScoutKapazitaet) * 100)

  return (
    <PageWrapper
      title="Operations"
      subtitle="Betrieblicher Status — immer aktuell"
    >
      {/* ── Row 1: Hero KPIs ─────────────────────────────────────── */}
      <SectionGrid cols={4}>
        <KPICard
          label="Anfragen letzte 7 Tage"
          value={anfragenLetzt7Tage}
          format="number"
          status="neutral"
        />
        <KPICard
          label="Offene Anfragen >24h"
          value={anfragenDaten.ueberfaellig}
          format="number"
          status={anfragenDaten.ueberfaellig > 0 ? 'warning' : 'positive'}
          suffix={anfragenDaten.ueberfaellig > 0 ? 'überfällig' : 'alles im grünen Bereich'}
        />
        <KPICard
          label="ImmoScout-Auslastung"
          value={immoScoutPercent}
          format="percent"
          status={immoScoutPercent >= 90 ? 'warning' : 'neutral'}
          suffix={`${immoScoutAktiv} / ${immoScoutKapazitaet} Slots`}
        />
        <KPICard
          label="Inaktive Listings (>14d)"
          value={inaktiveListings.length}
          format="number"
          status={inaktiveListings.length > 0 ? 'warning' : 'positive'}
        />
      </SectionGrid>

      {/* ── Row 2: Secondary KPIs ────────────────────────────────── */}
      <SectionGrid cols={3} className="mt-4">
        <KPICard
          label="Anfragen gesamt (30d)"
          value={anfragenDaten.total}
          format="number"
          status="neutral"
        />
        <KPICard
          label="Bestätigte Beratungen (30d)"
          value={anfragenDaten.bestaetigt}
          format="number"
          status={anfragenDaten.bestaetigt > 0 ? 'positive' : 'neutral'}
        />
        <KPICard
          label="Makler-Stunden Auslastung"
          value="—"
          status="neutral"
          suffix="Demnächst"
        />
      </SectionGrid>

      {/* ── Row 3: Anfragen-Verlauf + Upcoming Termine ───────────── */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChartCard
            title="Anfrage-Volumen pro Tag (30 Tage)"
            subtitle="Tägliche Anfrage-Eingänge im Premium-Postfach"
          >
            <LineChart
              data={anfragenDaten.verlauf as unknown as Record<string, unknown>[]}
              xKey="datum"
              yKey="anzahl"
              height={200}
              formatY="number"
              formatX="date-short"
            />
          </ChartCard>
        </div>
        <div>
          <ChartCard
            title="Bevorstehende Beratungen"
            subtitle="Bestätigte Termine (nächste 7 Tage)"
          >
            {upcomingTermine.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <CalendarDays size={28} className="text-helios-text-subtle" />
                <p className="text-xs text-helios-text-subtle text-center">
                  Keine bestätigten Termine in den nächsten 7 Tagen
                </p>
              </div>
            ) : (
              <div className="divide-y divide-helios-border">
                {upcomingTermine.map((t: HeliosMaklerTermin) => (
                  <div key={t.id} className="py-2.5 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-helios-text">
                        {themaLabel(t.thema)}
                      </span>
                      {t.tier && (
                        <Badge variant={t.tier === 'premium' ? 'warning' : t.tier === 'pro' ? 'info' : 'success'}>
                          {t.tier}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-helios-text-muted">
                      {new Date(t.bestaetigterTermin).toLocaleString('de-DE', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    {t.userEmail && (
                      <span className="text-xs text-helios-text-subtle">{t.userEmail}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* ── Row 4: Inaktive Listings ─────────────────────────────── */}
      <div className="mt-4">
        <ChartCard
          title="Inaktive Listings (>14 Tage)"
          subtitle="Aktive Listings ohne Aktivität — Handlungsbedarf prüfen"
        >
          <DataTable<HeliosListing>
            data={inaktiveListings}
            columns={INAKTIV_COLUMNS}
            getRowKey={(l) => l.id}
            onRowHref={(l) => `/helios/listings/${l.id}`}
            emptyState={
              <EmptyState
                title="Keine inaktiven Listings"
                description="Alle aktiven Listings hatten in den letzten 14 Tagen Aktivität."
              />
            }
            caption="Inaktive Listings"
          />
        </ChartCard>
      </div>
    </PageWrapper>
  )
}
