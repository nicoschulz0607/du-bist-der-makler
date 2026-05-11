import type { ReactNode } from 'react'

interface PageWrapperProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

export function PageWrapper({ title, subtitle, actions, children }: PageWrapperProps) {
  return (
    <div className="px-8 py-7 min-h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-helios-text">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-helios-text-muted">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
