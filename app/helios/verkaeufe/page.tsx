import { fetchVerkaufsListe, getVerkaufsMetriken } from '@/lib/helios/aggregations/verkaeufe'
import { PageWrapper }   from '@/lib/helios/components/layout/PageWrapper'
import { SectionGrid }   from '@/lib/helios/components/layout/SectionGrid'
import { ZeitraumTabs }  from '@/lib/helios/components/layout/ZeitraumTabs'
import { KPICard }       from '@/lib/helios/components/kpi/KPICard'
import { ChartCard }     from '@/lib/helios/components/charts/ChartCard'
import { DonutChart }    from '@/lib/helios/components/charts/DonutChart'
import { DataTable }     from '@/lib/helios/components/tables/DataTable'
import type { ColumnDef } from '@/lib/helios/components/tables/DataTable'
import { Badge }         from '@/lib/helios/components/primitives/Badge'
import type { BadgeVariant } from '@/lib/helios/components/primitives/Badge'
import { EmptyState }    from '@/lib/helios/components/feedback/EmptyState'
import type { HeliosListing } from '@/lib/helios/sources/supabase'
import { ShoppingBag }   from 'lucide-react'

function tierVariant(tier: HeliosListing['paketTier']): BadgeVariant {
  if (tier === 'premium') return 'warning'
  if (tier === 'pro')     return 'info'
  if (tier === 'basic')   return 'success'
  return 'neutral'
}

const COLUMNS: ColumnDef<HeliosListing>[] = [
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
    key: 'paketTier',
    header: 'Paket',
    render: (l) => <Badge variant={tierVariant(l.paketTier)}>{l.paketTier ?? '—'}</Badge>,
  },
  {
    key: 'preis',
    header: 'Verkaufspreis',
    align: 'right',
    render: (l) =>
      l.preis != null
        ? l.preis.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
        : <span className="text-helios-text-subtle">—</span>,
  },
  {
    key: 'tageAktiv',
    header: 'Tage bis Verkauf',
    align: 'right',
    render: (l) => {
      if (!l.verkaufAm) return <span className="text-helios-text-subtle">—</span>
      const tage = Math.floor(
        (new Date(l.verkaufAm).getTime() - new Date(l.createdAt).getTime()) / 86_400_000
      )
      return <span className="tabular-nums">{Math.max(0, tage)}</span>
    },
  },
  {
    key: 'verkauftAm',
    header: 'Verkauft am',
    align: 'right',
    render: (l) =>
      l.verkaufAm
        ? new Date(l.verkaufAm).toLocaleDateString('de-DE')
        : <span className="text-helios-text-subtle">—</span>,
  },
]

export default async function VerkaeufePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const tage = Math.max(7, Math.min(90, parseInt(String(params.tage ?? '30'), 10) || 30))

  const bis = new Date()
  const von = new Date(bis.getTime() - tage * 86_400_000)
  const zeitraum = { von: von.toISOString(), bis: bis.toISOString() }

  const [liste, metriken] = await Promise.all([
    fetchVerkaufsListe(zeitraum),
    getVerkaufsMetriken(zeitraum),
  ])

  const tierData = Object.entries(metriken.nachTier)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))

  return (
    <PageWrapper
      title="Verkäufe"
      subtitle={`${von.toLocaleDateString('de-DE')} – ${bis.toLocaleDateString('de-DE')}`}
      actions={<ZeitraumTabs pathname="/helios/verkaeufe" active={String(tage)} />}
    >
      {/* ── Row 1: KPIs ──────────────────────────────────────────── */}
      <SectionGrid cols={3}>
        <KPICard
          label={`Verkäufe (${tage} Tage)`}
          value={metriken.totalCount}
          format="number"
          status={metriken.totalCount > 0 ? 'positive' : 'neutral'}
        />
        <KPICard
          label="Ø Verkaufspreis"
          value={metriken.avgPreisEur !== null ? metriken.avgPreisEur : '—'}
          format="eur"
          status="neutral"
          suffix={metriken.avgPreisEur !== null ? `${liste.filter(l => l.preis != null).length} Listings` : undefined}
        />
        <KPICard
          label="Ø Tage bis Verkauf"
          value={metriken.avgDaysToSale !== null ? metriken.avgDaysToSale : '—'}
          format="days"
          status="neutral"
          suffix={
            metriken.daysToSaleN > 0
              ? `aus ${metriken.daysToSaleN} Listings`
              : 'Kein Verkaufsdatum vorhanden'
          }
        />
      </SectionGrid>

      {/* ── Row 2: Tabelle + Donut ────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DataTable<HeliosListing>
            data={liste}
            columns={COLUMNS}
            getRowKey={(l) => l.id}
            onRowHref={(l) => `/helios/listings/${l.id}`}
            emptyState={
              <EmptyState
                icon={<ShoppingBag size={36} />}
                title="Keine Verkäufe im Zeitraum"
                description="Listings erscheinen hier sobald ihr Status auf 'verkauft' gesetzt wird."
              />
            }
            caption="Verkaufte Listings"
          />
        </div>
        <div>
          <ChartCard title="Verkäufe nach Paket" subtitle="Anzahl im Zeitraum">
            <DonutChart
              data={tierData}
              height={200}
              formatValue="number"
            />
          </ChartCard>
        </div>
      </div>
    </PageWrapper>
  )
}
