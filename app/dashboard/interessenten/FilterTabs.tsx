'use client'

interface Counts {
  alle: number
  unbeantwortet: number
  neu: number
  aktiv: number
  abgeschlossen: number
}

interface Props {
  current: string
  onChange: (filter: string) => void
  counts: Counts
}

const TABS: { id: keyof Counts; label: string }[] = [
  { id: 'alle', label: 'Alle' },
  { id: 'unbeantwortet', label: 'Unbeantwortet' },
  { id: 'neu', label: 'Neu' },
  { id: 'aktiv', label: 'Aktiv' },
  { id: 'abgeschlossen', label: 'Abgeschlossen' },
]

export default function FilterTabs({ current, onChange, counts }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors
            ${current === tab.id
              ? 'bg-[#1B6B45] text-white'
              : 'bg-gray-100 text-text-secondary hover:bg-gray-200'}
          `}
        >
          {tab.label}
          <span className={`text-[11px] font-semibold ${current === tab.id ? 'text-white/70' : 'text-text-tertiary'}`}>
            {counts[tab.id]}
          </span>
        </button>
      ))}
    </div>
  )
}
