import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchKundeDetails } from '@/lib/helios/sources/supabase'
import type { HeliosPaket, HeliosListing } from '@/lib/helios/sources/supabase'
import { PageWrapper } from '@/lib/helios/components/layout/PageWrapper'
import { SectionGrid } from '@/lib/helios/components/layout/SectionGrid'
import { KPICard } from '@/lib/helios/components/kpi/KPICard'
import { Card } from '@/lib/helios/components/primitives/Card'
import { Badge } from '@/lib/helios/components/primitives/Badge'
import type { BadgeVariant } from '@/lib/helios/components/primitives/Badge'
import { DataTable } from '@/lib/helios/components/tables/DataTable'
import type { ColumnDef } from '@/lib/helios/components/tables/DataTable'
import { EmptyState } from '@/lib/helios/components/feedback/EmptyState'
import { RefundIsland } from '@/app/helios/kunden/RefundIsland'
import { EmailIsland } from '@/app/helios/kunden/EmailIsland'
import { Package, Inbox } from 'lucide-react'

function tierVariant(tier: string | null): BadgeVariant {
  if (tier === 'premium') return 'warning'
  if (tier === 'pro') return 'info'
  if (tier === 'basic') return 'success'
  return 'neutral'
}

function paketStatusVariant(status: HeliosPaket['status']): BadgeVariant {
  if (status === 'aktiv') return 'success'
  if (status === 'refunded') return 'danger'
  if (status === 'storniert') return 'neutral'
  return 'neutral'
}

function paketStatusLabel(status: HeliosPaket['status']): string {
  if (status === 'aktiv') return 'Aktiv'
  if (status === 'abgelaufen') return 'Abgelaufen'
  if (status === 'storniert') return 'Storniert'
  if (status === 'refunded') return 'Erstattet'
  return status
}

function tageAktiv(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

const paketColumns: ColumnDef<HeliosPaket>[] = [
  {
    key: 'typ',
    header: 'Typ',
    render: (p) => (
      <div>
        <span className="text-sm text-helios-text capitalize">{p.typ}</span>
        {p.addonType && (
          <p className="text-xs text-helios-text-muted">{p.addonType}</p>
        )}
      </div>
    ),
  },
  {
    key: 'tier',
    header: 'Paket',
    render: (p) =>
      p.tier ? (
        <Badge variant={tierVariant(p.tier)}>{p.tier}</Badge>
      ) : (
        <span className="text-helios-text-subtle text-sm">—</span>
      ),
  },
  {
    key: 'betragCent',
    header: 'Betrag',
    align: 'right',
    render: (p) =>
      (p.betragCent / 100).toLocaleString('de-DE', {
        style: 'currency',
        currency: 'EUR',
      }),
  },
  {
    key: 'startDatum',
    header: 'Start',
    render: (p) => new Date(p.startDatum).toLocaleDateString('de-DE'),
  },
  {
    key: 'endeDatum',
    header: 'Ende',
    render: (p) => new Date(p.endeDatum).toLocaleDateString('de-DE'),
  },
  {
    key: 'status',
    header: 'Status',
    render: (p) => (
      <Badge variant={paketStatusVariant(p.status)}>{paketStatusLabel(p.status)}</Badge>
    ),
  },
  {
    key: 'aktion',
    header: 'Aktion',
    render: (p) =>
      p.status === 'aktiv' ? (
        <RefundIsland paketId={p.id} betragCent={p.betragCent} />
      ) : null,
  },
]

const listingColumns: ColumnDef<HeliosListing>[] = [
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
    key: 'status',
    header: 'Status',
    render: (l) => {
      const variant: BadgeVariant = l.status === 'aktiv' ? 'success' : l.status === 'verkauft' ? 'info' : 'neutral'
      const label = l.status === 'aktiv' ? 'Aktiv' : l.status === 'verkauft' ? 'Verkauft' : 'Entwurf'
      return <Badge variant={variant}>{label}</Badge>
    },
  },
  {
    key: 'preis',
    header: 'Preis',
    align: 'right',
    render: (l) =>
      l.preis != null
        ? l.preis.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
        : <span className="text-helios-text-subtle">—</span>,
  },
  {
    key: 'tageAktiv',
    header: 'Tage aktiv',
    align: 'right',
    render: (l) => tageAktiv(l.createdAt),
  },
]

export default async function KundeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const kunde = await fetchKundeDetails(id)

  if (!kunde) notFound()

  const totalAusgaben = kunde.paketHistory
    .filter((p) => p.status !== 'refunded')
    .reduce((sum, p) => sum + p.betragCent, 0) / 100

  return (
    <PageWrapper
      title={kunde.email ?? 'Unbekannter Kunde'}
      subtitle={kunde.vorname ?? undefined}
      actions={
        <Link
          href="/helios/kunden"
          className="text-sm text-helios-text-muted hover:text-helios-text flex items-center gap-1"
        >
          ← Alle Kunden
        </Link>
      }
    >
      <SectionGrid cols={4}>
        <KPICard label="Gesamtausgaben" value={totalAusgaben} format="eur" />
        <KPICard label="Pakete gesamt" value={kunde.paketHistory.length} format="number" />
        <KPICard
          label="Aktiv bis"
          value={
            kunde.paketAktivBis
              ? new Date(kunde.paketAktivBis).toLocaleDateString('de-DE')
              : '—'
          }
        />
        <KPICard
          label="Tier"
          value={kunde.paketTier ?? '—'}
          suffix={kunde.listingCount + ' Listings'}
        />
      </SectionGrid>

      <Card className="mt-6">
        <h2 className="text-sm font-semibold text-helios-text mb-4">Paket-Historie</h2>
        <DataTable<HeliosPaket>
          data={kunde.paketHistory}
          columns={paketColumns}
          getRowKey={(p) => p.id}
          emptyState={
            <EmptyState
              icon={<Package size={32} />}
              title="Keine Pakete"
              description="Dieser Kunde hat noch kein Paket gekauft."
            />
          }
          caption="Paket-Historie"
        />
      </Card>

      <Card className="mt-4">
        <h2 className="text-sm font-semibold text-helios-text mb-4">Listings</h2>
        <DataTable<HeliosListing>
          data={kunde.listings}
          columns={listingColumns}
          getRowKey={(l) => l.id}
          onRowHref={(l) => `/helios/listings/${l.id}`}
          emptyState={
            <EmptyState
              icon={<Inbox size={32} />}
              title="Keine Listings"
              description="Dieser Kunde hat noch kein Listing angelegt."
            />
          }
          caption="Listings dieses Kunden"
        />
      </Card>

      <Card className="mt-4">
        <h2 className="text-sm font-semibold text-helios-text mb-4">E-Mail senden</h2>
        <EmailIsland userId={kunde.id} />
      </Card>
    </PageWrapper>
  )
}
