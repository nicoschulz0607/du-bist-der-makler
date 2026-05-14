'use client'

import { useActionState, useState } from 'react'
import { addFixedCost, removeFixedCost, type ActionResult } from '@/app/helios/actions'
import { ConfirmDialog } from '@/lib/helios/components/feedback/ConfirmDialog'
import { Toast } from '@/lib/helios/components/feedback/Toast'
import type { FixkostenRow } from '@/lib/helios/sources/supabase'

interface Props {
  kosten: FixkostenRow[]
}

const CATEGORIES = [
  { value: 'infra', label: 'Infrastruktur' },
  { value: 'portal', label: 'Portal' },
  { value: 'legal', label: 'Legal' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'tools', label: 'Tools' },
  { value: 'sonstiges', label: 'Sonstiges' },
]

function formatEur(cent: number): string {
  return (cent / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

const todayIso = new Date().toISOString().slice(0, 10)

export function FixkostenIsland({ kosten }: Props) {
  const [addState, formAction, isPending] = useActionState(addFixedCost, null)
  const [addDismissed, setAddDismissed] = useState(false)
  const [removeResult, setRemoveResult] = useState<ActionResult | null>(null)

  const addToast = addDismissed ? null : addState

  return (
    <div className="space-y-6">
      {/* Add-Form */}
      <div className="bg-helios-surface rounded-xl border border-helios-border p-4">
        <h3 className="text-sm font-semibold text-helios-text mb-3">Fixkosten hinzufügen</h3>
        <form
          action={(fd) => {
            setAddDismissed(false)
            formAction(fd)
          }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <div>
            <label className="block text-xs font-medium text-helios-text-muted mb-1">Name</label>
            <input
              name="name"
              type="text"
              required
              placeholder="z.B. Vercel Pro"
              className="w-full rounded-lg border border-helios-border bg-helios-bg px-3 py-2 text-sm text-helios-text focus:outline-none focus:ring-2 focus:ring-helios-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-helios-text-muted mb-1">
              Betrag / Monat
              <span className="ml-1 text-helios-text-subtle">(z.B. 20.50 oder 20,50)</span>
            </label>
            <input
              name="betrag"
              type="text"
              inputMode="decimal"
              required
              placeholder="20,00"
              className="w-full rounded-lg border border-helios-border bg-helios-bg px-3 py-2 text-sm text-helios-text focus:outline-none focus:ring-2 focus:ring-helios-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-helios-text-muted mb-1">Kategorie</label>
            <select
              name="category"
              required
              className="w-full rounded-lg border border-helios-border bg-helios-bg px-3 py-2 text-sm text-helios-text focus:outline-none focus:ring-2 focus:ring-helios-accent"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-helios-text-muted mb-1">Gültig ab</label>
            <input
              name="gueltig_ab"
              type="date"
              required
              defaultValue={todayIso}
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
              <th className="text-left px-4 py-3 text-xs font-medium text-helios-text-muted">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-helios-text-muted">Betrag</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-helios-text-muted">Kategorie</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-helios-text-muted">Gültig ab</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-helios-border">
            {kosten.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-helios-text-subtle text-sm">
                  Keine aktiven Fixkosten
                </td>
              </tr>
            )}
            {kosten.map((k) => (
              <tr key={k.id} className="hover:bg-helios-surface-muted transition-colors">
                <td className="px-4 py-3 font-medium text-helios-text">{k.name}</td>
                <td className="px-4 py-3 text-helios-text-muted">{formatEur(k.betrag_cent)}</td>
                <td className="px-4 py-3 text-helios-text-muted capitalize">{k.category}</td>
                <td className="px-4 py-3 text-helios-text-muted">
                  {new Date(k.gueltig_ab).toLocaleDateString('de-DE')}
                </td>
                <td className="px-4 py-3 text-right">
                  <ConfirmDialog
                    trigger={
                      <button className="text-xs font-medium text-helios-danger hover:underline">
                        Beenden
                      </button>
                    }
                    title="Fixkosten beenden?"
                    description={`"${k.name}" beenden? Der Eintrag bleibt für das Archiv erhalten.`}
                    onConfirm={async () => {
                      const r = await removeFixedCost(k.id)
                      setRemoveResult(r)
                      return r
                    }}
                    actionLabel="Beenden"
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
