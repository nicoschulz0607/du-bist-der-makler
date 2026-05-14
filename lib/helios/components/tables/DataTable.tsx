import type { ReactNode } from 'react'
import Link from 'next/link'
import { EmptyState } from '@/lib/helios/components/feedback/EmptyState'

export interface ColumnDef<T> {
  key: string
  header: string
  width?: string
  align?: 'left' | 'right' | 'center'
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  getRowKey: (row: T) => string
  onRowHref?: (row: T) => string
  getRowClassName?: (row: T) => string
  emptyState?: ReactNode
  caption?: string
}

const alignMap = { left: 'text-left', right: 'text-right', center: 'text-center' }

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  onRowHref,
  getRowClassName,
  emptyState,
  caption,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-helios-surface border border-helios-border rounded-xl">
        {emptyState ?? <EmptyState title="Keine Daten" />}
      </div>
    )
  }

  return (
    <div className="bg-helios-surface border border-helios-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {caption && (
            <caption className="sr-only">{caption}</caption>
          )}
          <thead>
            <tr className="border-b border-helios-border bg-helios-surface-muted">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-semibold text-helios-text-muted uppercase tracking-wide ${alignMap[col.align ?? 'left']} ${col.width ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-helios-border">
            {data.map((row) => {
              const key = getRowKey(row)
              const href = onRowHref?.(row)
              const extraClass = getRowClassName?.(row) ?? ''

              return (
                <tr
                  key={key}
                  className={`relative hover:bg-helios-surface-muted transition-colors ${href ? 'cursor-pointer' : ''} ${extraClass}`}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-helios-text ${alignMap[col.align ?? 'left']} ${col.width ?? ''}`}
                    >
                      {/* Full-row link overlay on first cell */}
                      {href && colIdx === 0 && (
                        <Link href={href} className="absolute inset-0 z-[1]" aria-label="Zeile öffnen" />
                      )}
                      <span className="relative">{col.render(row)}</span>
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
