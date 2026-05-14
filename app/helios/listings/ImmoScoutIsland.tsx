'use client'

import { useState, useTransition } from 'react'
import { setImmoScoutStatus } from '@/app/helios/actions'
import { Toast } from '@/lib/helios/components/feedback/Toast'
import type { ActionResult } from '@/app/helios/actions'

const STATUS_OPTIONS = [
  { value: '', label: '—' },
  { value: 'Veröffentlicht', label: 'Veröffentlicht' },
  { value: 'Pausiert', label: 'Pausiert' },
  { value: 'Abgelaufen', label: 'Abgelaufen' },
]

interface ImmoScoutIslandProps {
  listingId: string
  currentStatus: string | null
}

export function ImmoScoutIsland({ listingId, currentStatus }: ImmoScoutIslandProps) {
  const [selected, setSelected] = useState(currentStatus ?? '')
  const [result, setResult] = useState<ActionResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      // empty string → null in DB, never persist the "—" string
      const newStatus = selected === '' ? null : selected
      const res = await setImmoScoutStatus(listingId, newStatus)
      setResult(res)
    })
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded-lg border border-helios-border bg-helios-surface px-3 py-2 text-sm text-helios-text focus:outline-none focus:ring-2 focus:ring-helios-accent"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        onClick={handleSave}
        disabled={isPending}
        className="px-4 py-2 rounded-lg bg-helios-accent text-white text-sm font-medium hover:bg-helios-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Speichern…' : 'Speichern'}
      </button>
      <Toast result={result} onDismiss={() => setResult(null)} />
    </div>
  )
}
