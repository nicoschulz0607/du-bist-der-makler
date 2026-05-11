import { ReactNode } from 'react'
import type { StationLayout } from '@/lib/wizard/config'

interface WizardLayoutProps {
  layout: StationLayout
  sidebar?: ReactNode
  children: ReactNode
}

export default function WizardLayout({ layout, sidebar, children }: WizardLayoutProps) {
  if (layout === 'wide') {
    return (
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-6 md:py-10 w-full">
        {children}
      </div>
    )
  }

  if (layout === 'split') {
    return (
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-6 md:py-10 w-full">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
          <div className="min-w-0">{children}</div>
          {sidebar && (
            <aside className="hidden lg:block sticky top-6">
              {sidebar}
            </aside>
          )}
        </div>
      </div>
    )
  }

  // focus with sidebar
  if (sidebar) {
    return (
      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-6 md:py-10 w-full">
        <div className="grid lg:grid-cols-[640px_320px] gap-8 justify-center items-start">
          <div className="min-w-0">{children}</div>
          <aside className="hidden lg:block sticky top-6">
            {sidebar}
          </aside>
        </div>
      </div>
    )
  }

  // focus ohne sidebar (default)
  return (
    <div className="max-w-[640px] mx-auto px-6 py-6 md:py-10 w-full">
      {children}
    </div>
  )
}
