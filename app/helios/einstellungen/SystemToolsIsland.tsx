'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { revalidateHeliosCache } from '@/app/helios/actions'
import { Toast } from '@/lib/helios/components/feedback/Toast'
import type { ActionResult } from '@/app/helios/actions'

interface Props {
  letzterCacheClear: { created_at: string; admin_email: string } | null
}

export function SystemToolsIsland({ letzterCacheClear }: Props) {
  const [result, setResult] = useState<ActionResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClear() {
    startTransition(async () => {
      const r = await revalidateHeliosCache()
      setResult(r)
      if (r.ok) router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="bg-helios-surface rounded-xl border border-helios-border p-6 max-w-lg">
        <h3 className="text-sm font-semibold text-helios-text mb-1">Cache leeren</h3>
        <p className="text-xs text-helios-text-muted mb-4">
          Erzwingt ein Re-Fetch aller gecachten Helios-Seiten. Nützlich nach direkten
          Datenbank-Änderungen oder wenn KPIs veraltete Werte zeigen.
        </p>

        <div className="flex items-center gap-4">
          <button
            onClick={handleClear}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-helios-accent text-white text-sm font-medium hover:bg-helios-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Wird geleert…' : 'Cache leeren'}
          </button>

          <span className="text-xs text-helios-text-muted">
            {letzterCacheClear
              ? `Zuletzt geleert: ${new Date(letzterCacheClear.created_at).toLocaleString('de-DE', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })} von ${letzterCacheClear.admin_email}`
              : 'Noch nie geleert'}
          </span>
        </div>
      </div>

      <Toast result={result} onDismiss={() => setResult(null)} />
    </div>
  )
}
