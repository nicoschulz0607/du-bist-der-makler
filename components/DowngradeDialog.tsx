'use client'

import { X } from 'lucide-react'

const TIER_LABELS: Record<string, string> = {
  basic: 'Basic',
  pro: 'Pro',
  premium: 'Premium',
}

const DURATION_LABELS: Record<number, string> = {
  1: '1 Monat',
  3: '3 Monate',
  6: '6 Monate',
}

type DowngradeGrund = 'downgrade_tier' | 'downgrade_laufzeit' | 'identisch'

interface DowngradeDialogProps {
  open: boolean
  onClose: () => void
  grund: DowngradeGrund
  aktuelles_paket: { tier: string; laufzeit_monate: number; ende_datum: string }
  neues_paket: { tier: string; laufzeit: number }
}

export default function DowngradeDialog({
  open,
  onClose,
  grund,
  aktuelles_paket,
  neues_paket,
}: DowngradeDialogProps) {
  if (!open) return null

  const endDate = new Date(aktuelles_paket.ende_datum).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const altTierLabel = TIER_LABELS[aktuelles_paket.tier] ?? aktuelles_paket.tier
  const neuTierLabel = TIER_LABELS[neues_paket.tier] ?? neues_paket.tier
  const altDurationLabel = DURATION_LABELS[aktuelles_paket.laufzeit_monate] ?? `${aktuelles_paket.laufzeit_monate} Monate`

  let titel: string
  let text: React.ReactNode

  if (grund === 'downgrade_tier') {
    titel = 'Wechsel nicht möglich'
    text = (
      <>
        Du hast aktuell das{' '}
        <span className="font-semibold text-text-primary">{altTierLabel}</span>-Paket aktiv.
        Ein Wechsel auf ein günstigeres Paket (
        <span className="font-semibold text-text-primary">{neuTierLabel}</span>)
        ist während der laufenden Vertragslaufzeit nicht möglich.{' '}
        Dein aktuelles Paket läuft noch bis{' '}
        <span className="font-semibold text-text-primary">{endDate}</span>.
        Danach kannst du frei ein neues Paket buchen.
      </>
    )
  } else if (grund === 'downgrade_laufzeit') {
    titel = 'Kürzere Laufzeit nicht möglich'
    text = (
      <>
        Du hast aktuell das{' '}
        <span className="font-semibold text-text-primary">{altTierLabel}</span>-Paket
        mit {altDurationLabel}. Ein Wechsel auf eine kürzere Laufzeit ist nicht möglich.{' '}
        Du kannst stattdessen einen Tier-Upgrade mit gleicher oder längerer Laufzeit wählen.
      </>
    )
  } else {
    titel = 'Du hast dieses Paket bereits'
    text = (
      <>
        Das gewählte Paket entspricht deinem aktuell aktiven Paket.
        Wenn du den Tier wechseln oder die Laufzeit verlängern möchtest,
        wähle ein anderes Paket.
      </>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="downgrade-dialog-titel"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl border border-[#DDDDDD] shadow-xl max-w-[440px] w-full p-7 z-10">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface transition-colors duration-150"
          aria-label="Schließen"
        >
          <X size={18} />
        </button>

        {/* Neutraler Header-Streifen */}
        <div className="mb-5">
          <span className="inline-block px-2.5 py-1 rounded-full bg-[#F5F5F5] border border-[#DDDDDD] text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Hinweis
          </span>
          <h2
            id="downgrade-dialog-titel"
            className="text-[20px] font-bold text-text-primary"
            style={{ letterSpacing: '-0.18px' }}
          >
            {titel}
          </h2>
        </div>

        <p className="text-[14px] font-medium text-text-secondary leading-relaxed mb-6">
          {text}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full inline-flex items-center justify-center rounded-pill border-2 border-[#DDDDDD] text-text-primary text-[14px] font-semibold px-5 h-11 hover:bg-surface transition-colors duration-150"
        >
          Verstanden
        </button>

        <p className="mt-4 text-center text-[12px] font-medium text-text-tertiary">
          Du brauchst trotzdem einen Wechsel?{' '}
          <a
            href="mailto:kontakt@dubistdermakler.de"
            className="text-accent hover:underline"
          >
            Schreib uns an kontakt@dubistdermakler.de
          </a>
        </p>
      </div>
    </div>
  )
}
