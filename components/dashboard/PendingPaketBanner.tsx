'use client'

import { useState } from 'react'
import { X, ShoppingCart } from 'lucide-react'
import type { Tier, Laufzeit } from '@/lib/stripe-config'

const TIER_LABELS: Record<Tier, string> = { basic: 'Basic', pro: 'Pro', premium: 'Premium' }

const PRICING: Record<Tier, Record<Laufzeit, number>> = {
  basic:   { 1: 129, 3: 299, 6: 499 },
  pro:     { 1: 169, 3: 399, 6: 669 },
  premium: { 1: 219, 3: 519, 6: 869 },
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default function PendingPaketBanner({ tier, laufzeit }: { tier: Tier; laufzeit: Laufzeit }) {
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (dismissed) return null

  async function handleCheckout() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Confirm-Paketwechsel': 'true',
        },
        body: JSON.stringify({ kind: 'paket', tier, laufzeit }),
      })
      if (res.ok) {
        const data = await res.json()
        window.location.href = data.url
        return
      }
      setError('Etwas ist schiefgelaufen. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }

  const preis = PRICING[tier][laufzeit]
  const durationLabel = laufzeit === 1 ? '1 Monat' : `${laufzeit} Monate`

  return (
    <div className="relative bg-accent rounded-xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-150"
        aria-label="Banner schließen"
      >
        <X size={16} />
      </button>

      <div className="flex-1 min-w-0 pr-6">
        <p className="text-[15px] font-bold text-white mb-0.5">
          Du wolltest das {TIER_LABELS[tier]}-Paket für {durationLabel}
        </p>
        <p className="text-[13px] text-white/75">
          Schließe deinen Kauf jetzt ab und starte mit dem Verkauf deiner Immobilie.
        </p>
        {error && <p className="text-[12px] font-semibold text-white/90 mt-1">{error}</p>}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <a
          href="/#preise"
          className="inline-flex items-center justify-center rounded-pill border-2 border-white/30 text-white text-[13px] font-semibold px-4 h-9 hover:bg-white/10 transition-colors duration-150 whitespace-nowrap"
        >
          Anderes Paket
        </a>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={loading}
          className="inline-flex items-center gap-1.5 justify-center rounded-pill bg-white text-accent text-[13px] font-bold px-4 h-9 hover:bg-[#F7F7F7] transition-colors duration-150 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? <Spinner /> : <ShoppingCart size={14} />}
          {loading ? 'Wird geladen…' : `Jetzt buchen — ${preis} €`}
        </button>
      </div>
    </div>
  )
}
