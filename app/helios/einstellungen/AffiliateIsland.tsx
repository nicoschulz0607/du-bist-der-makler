'use client'

import { useActionState, useState } from 'react'
import { addAffiliateRevenue, removeAffiliateRevenue, type ActionResult } from '@/app/helios/actions'
import { ConfirmDialog } from '@/lib/helios/components/feedback/ConfirmDialog'
import { Toast } from '@/lib/helios/components/feedback/Toast'
import type { AffiliateRow } from '@/lib/helios/sources/supabase'

interface Props {
  revenue: AffiliateRow[]
}

function formatEur(cent: number): string {
  return (cent / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

const todayIso = new Date().toISOString().slice(0, 10)

export function AffiliateIsland({ revenue }: Props) {
  const [addState, formAction, isPending] = useActionState(addAffiliateRevenue, null)
  const [addDismissed, setAddDismissed] = useState(false)
  const [removeResult, setRemoveResult] = useState<ActionResult | null>(null)

  const addToast = addDismissed ? null : addState

  return (
    <div className="space-y-6">
      {/* Add-Form */}
      <div className="bg-helios-surface rounded-xl border border-helios-border p-4">
        <h3 className="text-sm font-semibold text-helios-text mb-3">Affiliate-Einnahme erfassen</h3>
        <form
          action={(fd) => {
            setAddDismissed(false)
            formAction(fd)
          }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <div>
            <label className="block text-xs font-medium text-helios-text-muted mb-1">Partner</label>
            <input
              name="partner"
              type="text"
              required
              placeholder="z.B. Energieausweis24"
              className="w-full rounded-lg border border-helios-border bg-helios-bg px-3 py-2 text-sm text-helios-text focus:outline-none focus:ring-2 focus:ring-helios-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-helios-text-muted mb-1">
              Betrag
              <span className="ml-1 text-helios-text-subtle">(z.B. 15,00)</span>
            </label>
            <input
              name="betrag"
              type="text"
              inputMode="decimal"
              required
              placeholder="15,00"
              className="w-full rounded-lg border border-helios-border bg-helios-bg px-3 py-2 text-sm text-helios-text focus:outline-none focus:ring-2 focus:ring-helios-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-helios-text-muted mb-1">Datum</label>
            <input
              name="erstellt_am"
              type="date"
              required
              defaultValue={todayIso}
              className="w-full rounded-lg border border-helios-border bg-helios-bg px-3 py-2 text-sm text-helios-text focus:outline-none focus:ring-2 focus:ring-helios-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-helios-text-muted mb-1">
              Kunden-E-Mail
              <span className="ml-1 text-helios-text-subtle">(optional)</span>
            </label>
            <input
              name="kunden_email"
              type="email"
              placeholder="kunde@example.com"
              className="w-full rounded-lg border border-helios-border bg-helios-bg px-3 py-2 text-sm text-helios-text focus:outline-none focus:ring-2 focus:ring-helios-accent"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-helios-accent text-white text-sm font-medium hover:bg-helios-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Wird gespeichert…' : 'Hinzufügen'}
            </button>
          </div>
        </form>
        <Toast result={addToast} onDismiss={() => setAddDismissed(true)} />
      </div>

      {/* Liste */}
      <div className="bg-helios-surface rounded-xl border border-helios-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-helios-border">
              <th className="text-left px-4 py-3 text-xs font-medium text-helios-text-muted">Partner</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-helios-text-muted">Betrag</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-helios-text-muted">Datum</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-helios-text-muted">Kunde</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-helios-border">
            {revenue.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-helios-text-subtle text-sm">
                  Noch keine Affiliate-Einnahmen erfasst
                </td>
              </tr>
            )}
            {revenue.map((r) => (
              <tr key={r.id} className="hover:bg-helios-surface-muted transition-colors">
                <td className="px-4 py-3 font-medium text-helios-text">{r.partner}</td>
                <td className="px-4 py-3 text-helios-text-muted">{formatEur(r.betrag_cent)}</td>
                <td className="px-4 py-3 text-helios-text-muted">
                  {new Date(r.erstellt_am).toLocaleDateString('de-DE')}
                </td>
                <td className="px-4 py-3 text-helios-text-muted text-xs">{r.user_email ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <ConfirmDialog
                    trigger={
                      <button className="text-xs font-medium text-helios-danger hover:underline">
                        Löschen
                      </button>
                    }
                    title="Affiliate-Eintrag löschen?"
                    description={`Eintrag ${r.partner} (${formatEur(r.betrag_cent)}) vom ${new Date(r.erstellt_am).toLocaleDateString('de-DE')} löschen?`}
                    onConfirm={async () => {
                      const res = await removeAffiliateRevenue(r.id)
                      setRemoveResult(res)
                      return res
                    }}
                    actionLabel="Löschen"
                    variant="danger"
                    onResult={setRemoveResult}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Toast result={removeResult} onDismiss={() => setRemoveResult(null)} />
    </div>
  )
}
