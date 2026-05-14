import Link from 'next/link'

const OPTIONS = [
  { label: '7 Tage',  value: '7'  },
  { label: '30 Tage', value: '30' },
  { label: '90 Tage', value: '90' },
]

interface ZeitraumTabsProps {
  /** Current pathname so we can build correct hrefs */
  pathname: string
  /** Active value from searchParams (defaults to '30') */
  active?: string
}

export function ZeitraumTabs({ pathname, active = '30' }: ZeitraumTabsProps) {
  return (
    <div className="flex items-center gap-1 bg-helios-surface-muted rounded-lg p-0.5 border border-helios-border">
      {OPTIONS.map((opt) => {
        const isActive = opt.value === active
        return (
          <Link
            key={opt.value}
            href={`${pathname}?tage=${opt.value}`}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              isActive
                ? 'bg-helios-surface shadow-sm text-helios-text'
                : 'text-helios-text-muted hover:text-helios-text'
            }`}
          >
            {opt.label}
          </Link>
        )
      })}
    </div>
  )
}
