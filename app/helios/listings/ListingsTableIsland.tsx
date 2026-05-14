'use client'

import { useState, useMemo } from 'react'
import { DataTable } from '@/lib/helios/components/tables/DataTable'
import type { ColumnDef } from '@/lib/helios/components/tables/DataTable'
import { Badge } from '@/lib/helios/components/primitives/Badge'
import type { BadgeVariant } from '@/lib/helios/components/primitives/Badge'
import { EmptyState } from '@/lib/helios/components/feedback/EmptyState'
import { Home } from 'lucide-react'
import type { HeliosListing } from '@/lib/helios/sources/supabase'

function statusVariant(status: HeliosListing['status']): BadgeVariant {
  if (status === 'aktiv')    return 'success'
  if (status === 'verkauft') return 'info'
  return 'neutral'
}

function statusLabel(status: HeliosListing['status']): string {
  if (status === 'aktiv')    return 'Aktiv'
  if (status === 'verkauft') return 'Verkauft'
  return 'Entwurf'
}

function tierVariant(tier: HeliosListing['paketTier']): BadgeVariant {
  if (tier === 'premium') return 'warning'
  if (tier === 'pro')     return 'info'
  if (tier === 'basic')   return 'success'
  return 'neutral'
}

function tageAktiv(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
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
    key: 'userEmail',
    header: 'Verkäufer',
    render: (l) => <span className="text-sm text-helios-text-muted">{l.userEmail ?? '—'}</span>,
  },
  {
    key: 'paketTier',
    header: 'Paket',
    render: (l) => <Badge variant={tierVariant(l.paketTier)}>{l.paketTier ?? '—'}</Badge>,
  },
  {
    key: 'status',
    header: 'Status',
    render: (l) => <Badge variant={statusVariant(l.status)}>{statusLabel(l.status)}</Badge>,
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
    render: (l) => {
      const tage = tageAktiv(l.createdAt)
      return (
        <span className={tage > 14 && l.status === 'aktiv' ? 'text-helios-warning font-medium' : ''}>
          {tage}
        </span>
      )
    },
  },
]

const STATUS_OPTIONS = [
  { label: 'Entwurf',  value: 'draft' },
  { label: 'Aktiv',    value: 'aktiv' },
  { label: 'Verkauft', value: 'verkauft' },
]

const TIER_OPTIONS = [
  { label: 'Starter', value: 'basic' },
  { label: 'Pro',     value: 'pro' },
  { label: 'Premium', value: 'premium' },
]

export function ListingsTableIsland({ listings }: { listings: HeliosListing[] }) {
  const [search,       setSearch]  = useState('')
  const [statusFilter, setStatus]  = useState('')
  const [tierFilter,   setTier]    = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return listings.filter((l) => {
      const matchesSearch =
        !q ||
        (l.objekttyp?.toLowerCase().includes(q) ?? false) ||
        (l.adresseOrt?.toLowerCase().includes(q) ?? false) ||
        (l.userEmail?.toLowerCase().includes(q) ?? false)
      const matchesStatus = !statusFilter || l.status === statusFilter
      const matchesTier   = !tierFilter   || l.paketTier === tierFilter
      return matchesSearch && matchesStatus && matchesTier
    })
  }, [listings, search, statusFilter, tierFilter])

  const hasFilter = search || statusFilter || tierFilter

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Objekt, Ort oder Verkäufer suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] text-sm bg-helios-surface border border-helios-border rounded-lg px-3 py-2 text-helios-text placeholder:text-helios-text-subtle focus:outline-none focus:border-helios-accent"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value)}
          className="text-sm bg-helios-surface border border-helios-border rounded-lg px-3 py-2 text-helios-text focus:outline-none focus:border-helios-accent"
        >
          <option value="">Alle Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={tierFilter}
          onChange={(e) => setTier(e.target.value)}
          className="text-sm bg-helios-surface border border-helios-border rounded-lg px-3 py-2 text-helios-text focus:outline-none focus:border-helios-accent"
        >
          <option value="">Alle Pakete</option>
          {TIER_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <DataTable<HeliosListing>
        data={filtered}
        columns={COLUMNS}
        getRowKey={(l) => l.id}
        onRowHref={(l) => `/helios/listings/${l.id}`}
        getRowClassName={(l) => {
          const tage = tageAktiv(l.updatedAt)
          return l.status === 'aktiv' && tage > 14 ? 'bg-amber-50/60' : ''
        }}
        emptyState={
          <EmptyState
            icon={<Home size={36} />}
            title={hasFilter ? 'Keine Treffer' : 'Keine Listings'}
            description={
              hasFilter
                ? 'Suchbegriff oder Filter anpassen.'
                : 'Listings erscheinen hier sobald Kunden ihr erstes Inserat anlegen.'
            }
          />
        }
        caption="Listings-Übersicht"
      />
    </div>
  )
}
