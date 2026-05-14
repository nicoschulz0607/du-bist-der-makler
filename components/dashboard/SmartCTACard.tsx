import Link from 'next/link'
import { AlertCircle, Bell, Info, ArrowRight } from 'lucide-react'
import type { TriggerSignal, TriggerSchwere } from '@/lib/klara/triggers'

interface SmartCTACardProps {
  signal: TriggerSignal
}

const SCHWERE_CONFIG: Record<TriggerSchwere, {
  color: string
  icon: typeof AlertCircle
  ariaLabel: string
}> = {
  wichtig: { color: '#D04A2C', icon: AlertCircle, ariaLabel: 'Wichtig' },
  hinweis: { color: '#F0A030', icon: Bell,        ariaLabel: 'Hinweis' },
  info:    { color: '#1B6B45', icon: Info,        ariaLabel: 'Info'    },
}

export default function SmartCTACard({ signal }: SmartCTACardProps) {
  const config = SCHWERE_CONFIG[signal.schwere]
  const Icon = config.icon

  const content = (
    <>
      {/* Accent-Streifen links — Farbe signal-abhängig */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: config.color }}
        aria-hidden="true"
      />

      {/* Icon — Farbe signal-abhängig */}
      <Icon
        size={20}
        strokeWidth={2}
        style={{ color: config.color }}
        className="flex-shrink-0"
        aria-label={config.ariaLabel}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-text-primary truncate">
          {signal.titel}
        </p>
        <p className="text-[13px] text-text-secondary truncate">
          {signal.beschreibung}
        </p>
      </div>

      {/* Action — als span weil ganze Karte schon ein Link ist */}
      {signal.link_ziel && (
        <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent">
          {signal.empfohlene_aktion}
          <ArrowRight size={14} strokeWidth={2.5} />
        </span>
      )}
    </>
  )

  if (signal.link_ziel) {
    return (
      <Link
        href={signal.link_ziel}
        className="relative flex items-center gap-4 bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-5 py-4 pl-6 overflow-hidden transition-colors"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="relative flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-4 pl-6 overflow-hidden">
      {content}
    </div>
  )
}
