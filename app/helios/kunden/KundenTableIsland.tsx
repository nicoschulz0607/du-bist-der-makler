'use client'

import { useState, useMemo } from 'react'
import { DataTable } from '@/lib/helios/components/tables/DataTable'
import type { ColumnDef } from '@/lib/helios/components/tables/DataTable'
import { Badge } from '@/lib/helios/components/primitives/Badge'
import type { BadgeVariant } from '@/lib/helios/components/primitives/Badge'
import { EmptyState } from '@/lib/helios/components/feedback/EmptyState'
import { Users } from 'lucide-react'
import type { HeliosKunde } from '@/lib/helios/sources/supabase'

function tierVariant(tier: HeliosKunde['paketTier']): BadgeVariant {
  if (tier === 'premium') return 'warning'
  if (tier === 'pro') return 'info'
  if (tier === 'basic') return 'success'
  return 'neutral'
}

const COLUMNS: ColumnDef<HeliosKunde>[] = [
  {
    key: 'email',
    header: 'E-Mail',
    render: (k) => <span className="font-medium text-helios-text">{k.email ?? '—'}</span>,
  },
  {
    key: 'vorname',
    header: 'Name',
    render: (k) => k.vorname ?? <span className="text-helios-text-subtle">—</span>,
  },
  {
    key: 'paketTier',
    header: 'Paket',
    render: (k) => <Badge variant={tierVariant(k.paketTier)}>{k.paketTier ?? '—'}</Badge>,
  },
  {
    key: 'paketAktivBis',
    header: 'Aktiv bis',
    align: 'right',
    render: (k) =>
      k.paketAktivBis
        ? new Date(k.paketAktivBis).toLocaleDateString('de-DE')
        : <span className="text-helios-text-subtle">—</span>,
  },
  {
    key: 'listingCount',
    header: 'Listings',
    align: 'right',
    render: (k) => k.listingCount,
  },
  {
    key: 'createdAt',
    header: 'Kunde seit',
    align: 'right',
    render: (k) => new Date(k.createdAt).toLocaleDateString('de-DE'),
  },
]

const TIER_OPTIONS = [
  { label: 'Starter', value: 'basic' },
  { label: 'Pro',     value: 'pro' },
  { label: 'Premium', value: 'premium' },
]

export function KundenTableIsland({ kunden }: { kunden: HeliosKunde[] }) {
  const [search, setSearch]   = useState('')
  const [tierFilter, setTier] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return kunden.filter((k) => {
      const matchesSearch =
        !q ||
        (k.email?.toLowerCase().includes(q) ?? false) ||
        (k.vorname?.toLowerCase().includes(q) ?? false)
      const matchesTier = !tierFilter || k.paketTier === tierFilter
      return matchesSearch && matchesTier
    })
  }, [kunden, search, tierFilter])

  const hasFilter = search || tierFilter

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="E-Mail oder Name suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-0 text-sm bg-helios-surface border border-helios-border rounded-lg px-3 py-2 text-helios-text placeholder:text-helios-text-subtle focus:outline-none focus:border-helios-accent"
        />
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
      <DataTable<HeliosKunde>
        data={filtered}
        columns={COLUMNS}
        getRowKey={(k) => k.id}
        onRowHref={(k) => `/helios/kunden/${k.id}`}
        emptyState={
          <EmptyState
            icon={<Users size={36} />}
            title={hasFilter ? 'Keine Treffer' : 'Keine zahlenden Kunden'}
            description={
              hasFilter
                ? 'Suchbegriff oder Filter anpassen.'
                : 'Kunden erscheinen hier nach dem ersten Kauf.'
            }
          />
        }
        caption="Kundenliste"
      />
    </div>
  )
}
