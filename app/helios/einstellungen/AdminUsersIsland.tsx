'use client'

import { useActionState, useState, useTransition } from 'react'
import { addAdminUser, removeAdminUser, type ActionResult } from '@/app/helios/actions'
import { ConfirmDialog } from '@/lib/helios/components/feedback/ConfirmDialog'
import { Toast } from '@/lib/helios/components/feedback/Toast'
import type { AdminUserRow } from '@/lib/helios/sources/supabase'

interface Props {
  users: AdminUserRow[]
  currentAdminEmail: string
}

export function AdminUsersIsland({ users, currentAdminEmail }: Props) {
  const [addState, formAction, isPending] = useActionState(addAdminUser, null)
  const [addDismissed, setAddDismissed] = useState(false)
  const [removeResult, setRemoveResult] = useState<ActionResult | null>(null)
  const [, startTransition] = useTransition()

  const addToast = addDismissed ? null : addState

  function handleRemove(id: string): Promise<ActionResult> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const r = await removeAdminUser(id)
        setRemoveResult(r)
        resolve(r)
      })
    })
  }

  return (
    <div className="space-y-6">
      {/* Add-Form */}
      <div className="bg-helios-surface rounded-xl border border-helios-border p-4">
        <h3 className="text-sm font-semibold text-helios-text mb-3">Admin hinzufügen</h3>
        <form
          action={(fd) => {
            setAddDismissed(false)
            formAction(fd)
          }}
          className="flex gap-2"
        >
          <input
            name="email"
            type="email"
            required
            placeholder="admin@example.com"
            className="flex-1 rounded-lg border border-helios-border bg-helios-bg px-3 py-2 text-sm text-helios-text focus:outline-none focus:ring-2 focus:ring-helios-accent"
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-helios-accent text-white text-sm font-medium hover:bg-helios-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isPending ? 'Wird hinzugefügt…' : 'Hinzufügen'}
          </button>
        </form>
        <Toast result={addToast} onDismiss={() => setAddDismissed(true)} />
      </div>

      {/* Liste */}
      <div className="bg-helios-surface rounded-xl border border-helios-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-helios-border">
              <th className="text-left px-4 py-3 text-xs font-medium text-helios-text-muted">E-Mail</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-helios-text-muted">Hinzugefügt am</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-helios-text-muted">Hinzugefügt von</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-helios-border">
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-helios-text-subtle text-sm">
                  Keine Admins gefunden
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-helios-surface-muted transition-colors">
                <td className="px-4 py-3 font-medium text-helios-text">
                  {u.email}
                  {u.email === currentAdminEmail && (
                    <span className="ml-2 text-xs text-helios-text-subtle">(du)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-helios-text-muted">
                  {new Date(u.added_at).toLocaleDateString('de-DE')}
                </td>
                <td className="px-4 py-3 text-helios-text-muted">{u.added_by ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  {u.email === currentAdminEmail ? (
                    <span className="text-xs text-helios-text-subtle">—</span>
                  ) : (
                    <ConfirmDialog
                      trigger={
                        <button className="text-xs font-medium text-helios-danger hover:underline">
                          Entfernen
                        </button>
                      }
                      title="Admin entfernen?"
                      description={`${u.email} wirklich als Admin entfernen? Der Zugang zu Helios wird sofort gesperrt.`}
                      onConfirm={() => handleRemove(u.id)}
                      actionLabel="Entfernen"
                      variant="danger"
                      onResult={setRemoveResult}
                    />
                  )}
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
