import { ReactNode } from 'react'
import type { StationLayout } from '@/lib/wizard/config'

interface WizardLayoutProps {
  layout: StationLayout
  sidebar?: ReactNode
  header?: ReactNode
  children: ReactNode
}

export default function WizardLayout({ layout, sidebar, header, children }: WizardLayoutProps) {
  if (layout === 'wide') {
    return (
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-6 md:py-10 w-full">
        {header && <div className="mb-8">{header}</div>}
        {children}
      </div>
    )
  }

  if (layout === 'split') {
    return (
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-6 md:py-10 w-full">
        <div className="grid lg:grid-cols-[1fr_400px] gap-x-8">
          {header && (
            <div className="mb-8 lg:col-start-1 lg:row-start-1">{header}</div>
          )}
          <div className="min-w-0 lg:col-start-1 lg:row-start-2">{children}</div>
          {sidebar && (
            <aside className="hidden lg:block sticky top-6 lg:col-start-2 lg:row-start-2">
              {sidebar}
            </aside>
          )}
        </div>
      </div>
    )
  }

  // focus with sidebar — 2-row grid: header top-left, content + sidebar both in row 2
  if (sidebar) {
    return (
      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-6 md:py-10 w-full">
        <div className="grid lg:grid-cols-[640px_320px] gap-x-8 justify-center">
          {header && (
            <div className="mb-8 lg:col-start-1 lg:row-start-1">{header}</div>
          )}
          <div className="min-w-0 lg:col-start-1 lg:row-start-2">{children}</div>
          <aside className="hidden lg:block sticky top-6 lg:col-start-2 lg:row-start-2">
            {sidebar}
          </aside>
        </div>
      </div>
    )
  }

  // focus ohne sidebar
  return (
    <div className="max-w-[640px] mx-auto px-6 py-6 md:py-10 w-full">
      {header && <div className="mb-8">{header}</div>}
      {children}
    </div>
  )
}
