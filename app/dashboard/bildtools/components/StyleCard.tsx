import { CheckCircle2 } from 'lucide-react'

interface StyleCardProps {
  label: string
  gradient: string
  selected: boolean
  onSelect: () => void
}

export default function StyleCard({ label, gradient, selected, onSelect }: StyleCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'rounded-xl overflow-hidden border-2 transition-all duration-150 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        selected
          ? 'border-accent shadow-[var(--shadow-card)]'
          : 'border-border hover:border-accent/50',
      ].join(' ')}
    >
      <div className="w-full aspect-[4/3]" style={{ background: gradient }} aria-hidden />
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-text-primary">{label}</span>
        {selected && <CheckCircle2 size={14} className="text-accent flex-shrink-0" />}
      </div>
    </button>
  )
}
