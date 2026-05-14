'use client'

import Link from 'next/link'
import type { AuditRow } from '@/lib/helios/sources/supabase'

interface Props {
  rows: AuditRow[]
  total: number
  page: number
  perPage: number
}

export function AuditLogIsland({ rows, total, page, perPage }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <div className="space-y-4">
      <div className="bg-helios-surface rounded-xl border border-helios-border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-helios-border">
              <th className="text-left px-4 py-3 font-medium text-helios-text-muted">Zeitstempel</th>
              <th className="text-left px-4 py-3 font-medium text-helios-text-muted">Admin</th>
              <th className="text-left px-4 py-3 font-medium text-helios-text-muted">Action</th>
              <th className="text-left px-4 py-3 font-medium text-helios-text-muted">Typ</th>
              <th className="text-left px-4 py-3 font-medium text-helios-text-muted">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-helios-border">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-helios-text-subtle">
                  Keine Einträge
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-helios-surface-muted transition-colors align-top">
                <td className="px-4 py-2.5 text-helios-text-muted whitespace-nowrap">
                  {new Date(r.created_at).toLocaleString('de-DE', {
                    day: '2-digit', month: '2-digit', year: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-2.5 text-helios-text-muted max-w-[120px] truncate">{r.admin_email}</td>
                <td className="px-4 py-2.5">
                  <code className="font-mono text-helios-accent bg-helios-surface-muted px-1.5 py-0.5 rounded text-xs">
                    {r.action}
                  </code>
                </td>
                <td className="px-4 py-2.5 text-helios-text-muted">
                  {r.target_type ?? '—'}
                </td>
                <td className="px-4 py-2.5">
                  {(() => {
                    if (!r.details || Object.keys(r.details).length === 0) {
                      return <span className="text-helios-text-subtle">—</span>
                    }
                    const entries = Object.entries(r.details)
                    if (entries.length === 1) {
                      const [key, val] = entries[0]
                      return (
                        <span className="text-helios-text-muted">
                          {key}: <span className="text-helios-text">{String(val)}</span>
                        </span>
                      )
                    }
                    return (
                      <details className="cursor-pointer">
                        <summary className="text-helios-text-muted hover:text-helios-text select-none">
                          JSON
                        </summary>
                        <pre className="mt-1 text-xs text-helios-text-muted bg-helios-surface-muted rounded p-2 whitespace-pre-wrap break-all max-w-xs max-h-32 overflow-y-auto">
                          {JSON.stringify(r.details, null, 2)}
                        </pre>
                      </details>
                    )
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginierung */}
      <div className="flex items-center justify-between text-sm text-helios-text-muted">
        <span>
          {total} Einträge · Seite {page} / {totalPages}
        </span>
        <div className="flex gap-2">
          {hasPrev ? (
            <Link
              href={`/helios/einstellungen?tab=audit-log&page=${page - 1}`}
              className="px-3 py-1.5 rounded-lg border border-helios-border hover:bg-helios-surface-muted transition-colors"
            >
              ← Zurück
            </Link>
          ) : (
            <span className="px-3 py-1.5 rounded-lg border border-helios-border opacity-30 cursor-not-allowed">
              ← Zurück
            </span>
          )}
          {hasNext ? (
            <Link
              href={`/helios/einstellungen?tab=audit-log&page=${page + 1}`}
              className="px-3 py-1.5 rounded-lg border border-helios-border hover:bg-helios-surface-muted transition-colors"
            >
              Weiter →
            </Link>
          ) : (
            <span className="px-3 py-1.5 rounded-lg border border-helios-border opacity-30 cursor-not-allowed">
              Weiter →
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
