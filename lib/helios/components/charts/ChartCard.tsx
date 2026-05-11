import type { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  subtitle?: string
  footer?: string
  children: ReactNode
  className?: string
}

export function ChartCard({ title, subtitle, footer, children, className = '' }: ChartCardProps) {
  return (
    <div className={`bg-helios-surface border border-helios-border rounded-xl p-5 flex flex-col gap-4 ${className}`}>
      <div>
        <p className="text-sm font-semibold text-helios-text">{title}</p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-helios-text-muted">{subtitle}</p>
        )}
      </div>
      <div className="min-h-0">{children}</div>
      {footer && (
        <p className="text-xs text-helios-text-subtle border-t border-helios-border pt-3">{footer}</p>
      )}
    </div>
  )
}
