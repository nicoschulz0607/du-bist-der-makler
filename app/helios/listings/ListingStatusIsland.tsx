'use client'

import { useState, useTransition } from 'react'
import { ConfirmDialog } from '@/lib/helios/components/feedback/ConfirmDialog'
import { Toast } from '@/lib/helios/components/feedback/Toast'
import { setListingStatus, type ActionResult } from '@/app/helios/actions'
import type { HeliosListingStatus } from '@/lib/helios/sources/supabase'

interface ListingStatusIslandProps {
  listingId: string
  currentStatus: HeliosListingStatus
}

const STATUS_OPTIONS: { value: HeliosListingStatus; label: string }[] = [
  { value: 'draft', label: 'Entwurf' },
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'verkauft', label: 'Verkauft' },
]

export function ListingStatusIsland({ listingId, currentStatus }: ListingStatusIslandProps) {
  const [selected, setSelected] = useState<HeliosListingStatus>(currentStatus)
  const [result, setResult] = useState<ActionResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function applyDirect(newStatus: HeliosListingStatus) {
    setSelected(newStatus)
    startTransition(async () => {
      const r = await setListingStatus(listingId, newStatus)
      setResult(r)
    })
  }

  const selectedLabel = STATUS_OPTIONS.find(o => o.value === selected)?.label

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              if (opt.value === selected) return
              // verkauft: handled by ConfirmDialog below — just update selection
              if (opt.value === 'verkauft') {
                setSelected(opt.value)
                return
              }
              applyDirect(opt.value)
            }}
            disabled={isPending}
            className={[
              'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50',
              selected === opt.value
                ? 'bg-helios-accent text-white border-helios-accent'
                : 'bg-helios-surface text-helios-text-muted border-helios-border hover:border-helios-accent hover:text-helios-accent',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {selected === 'verkauft' && selected !== currentStatus && (
        <ConfirmDialog
          trigger={
            <button className="px-4 py-2 rounded-lg bg-helios-danger text-white text-sm font-medium hover:opacity-90 transition-opacity">
              Als &ldquo;{selectedLabel}&rdquo; markieren
            </button>
          }
          title="Listing als verkauft markieren?"
          description="Das Verkaufsdatum wird gesetzt. Dieser Status ist schwer rückgängig zu machen."
          onConfirm={() => setListingStatus(listingId, 'verkauft')}
          actionLabel="Verkauft markieren"
          variant="danger"
          onResult={(r) => setResult(r)}
        />
      )}

      <Toast result={result} onDismiss={() => setResult(null)} />
    </div>
  )
}
