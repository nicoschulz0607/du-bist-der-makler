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

function formatEur(amount: number): string {
  return amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

interface PaketWechselDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  aktuelles_paket: {
    tier: string
    laufzeit_monate: number
    ende_datum: string
    verbleibende_tage: number
    gesamt_tage: number
  }
  neues_paket: {
    tier: string
    laufzeit_monate: number
    preis: number
  }
  restwert: number
  aufpreis: number
}

export default function PaketWechselDialog({
  open,
  onClose,
  onConfirm,
  aktuelles_paket,
  neues_paket,
  restwert,
  aufpreis,
}: PaketWechselDialogProps) {
  if (!open) return null

  const endDate = new Date(aktuelles_paket.ende_datum).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const altTierLabel = TIER_LABELS[aktuelles_paket.tier] ?? aktuelles_paket.tier
  const altDurationLabel = DURATION_LABELS[aktuelles_paket.laufzeit_monate] ?? `${aktuelles_paket.laufzeit_monate} Monate`
  const neuTierLabel = TIER_LABELS[neues_paket.tier] ?? neues_paket.tier
  const neuDurationLabel = DURATION_LABELS[neues_paket.laufzeit_monate] ?? `${neues_paket.laufzeit_monate} Monate`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paket-wechsel-titel"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl border border-[#DDDDDD] shadow-xl max-w-[460px] w-full p-7 z-10">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface transition-colors duration-150"
          aria-label="Schließen"
        >
          <X size={18} />
        </button>

        <h2
          id="paket-wechsel-titel"
          className="text-[20px] font-bold text-text-primary mb-5"
          style={{ letterSpacing: '-0.18px' }}
        >
          Paket wechseln?
        </h2>

        {/* Aktuelles Paket */}
        <div className="bg-surface rounded-xl p-4 mb-3">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Dein aktuelles Paket
          </p>
          <p className="text-[14px] font-semibold text-text-primary">
            {altTierLabel} ({altDurationLabel})
          </p>
          <p className="text-[13px] text-text-secondary mt-0.5">Gültig bis {endDate}</p>
          <p className="text-[13px] text-text-secondary mt-0.5">
            Verbleibend: {aktuelles_paket.verbleibende_tage} von {aktuelles_paket.gesamt_tage} Tagen
          </p>
        </div>

        {/* Neues Paket */}
        <div className="bg-surface rounded-xl p-4 mb-3">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Dein neues Paket
          </p>
          <p className="text-[14px] font-semibold text-text-primary">
            {neuTierLabel} ({neuDurationLabel})
          </p>
          <p className="text-[13px] text-text-secondary mt-0.5">
            Preis: {formatEur(neues_paket.preis)}
          </p>
        </div>

        {/* Anrechnung */}
        <div className="bg-surface rounded-xl p-4 mb-5">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Anrechnung
          </p>
          <div className="flex justify-between items-center">
            <p className="text-[13px] text-text-secondary">Restwert deines aktuellen Pakets</p>
            <p className="text-[13px] font-semibold text-accent">−{formatEur(restwert)}</p>
          </div>
          <div className="border-t border-[#DDDDDD] my-2.5" />
          <div className="flex justify-between items-center">
            <p className="text-[14px] font-bold text-text-primary">Aufpreis</p>
            <p className="text-[14px] font-bold text-text-primary">{formatEur(aufpreis)}</p>
          </div>
        </div>

        {/* Hinweis */}
        <p className="text-[12px] font-medium text-text-tertiary leading-relaxed mb-5">
          Mit dem Wechsel wird dein aktuelles Paket zum Tag des Wechsels storniert.
          Der anteilige Restwert wird auf das neue Paket angerechnet, sodass du nur
          den Aufpreis zahlst.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center rounded-pill border-2 border-[#DDDDDD] text-text-primary text-[14px] font-semibold px-5 h-11 hover:bg-surface transition-colors duration-150"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 inline-flex items-center justify-center rounded-pill bg-accent hover:bg-accent-hover text-white text-[14px] font-semibold px-5 h-11 transition-colors duration-150"
          >
            Ja, weiter — {formatEur(aufpreis)}
          </button>
        </div>
      </div>
    </div>
  )
}
