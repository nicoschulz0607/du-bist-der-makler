'use client'

import { useState } from 'react'
import { Check, Layers, ArrowRight, Minus, Sparkles } from 'lucide-react'
import PaketWechselDialog from '@/components/PaketWechselDialog'
import DowngradeDialog from '@/components/DowngradeDialog'

// ─── Types & Preise (aus brain.md) ───────────────────────────────────────────
type Duration = 1 | 3 | 6
type Tier = 'basic' | 'pro' | 'premium'

const DURATION_LABELS: Record<Duration, string> = {
  1: '1 Monat',
  3: '3 Monate',
  6: '6 Monate',
}

const PRICING = {
  basic:   { 1: 129, 3: 299, 6: 499 },
  pro:     { 1: 169, 3: 399, 6: 669 },
  premium: { 1: 219, 3: 519, 6: 869 },
} as const

function savings(tier: Tier, d: Duration): number | null {
  if (d === 1) return null
  return PRICING[tier][1] * d - PRICING[tier][d]
}

function monthly(tier: Tier, d: Duration): number {
  return Math.round(PRICING[tier][d] / d)
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─── Pakete ───────────────────────────────────────────────────────────────────
interface Plan {
  key: Tier
  name: string
  description: string
  features: string[]
  cta: string
  recommended?: boolean
}

const PLANS: Plan[] = [
  {
    key: 'basic',
    name: 'Basic',
    description: 'Ideal für den Einstieg.',
    features: [
      'ImmoScout24 Listing',
      'eBay Kleinanzeigen Listing',
      'Schritt-für-Schritt Checkliste',
      '24/7 KI-Chatbot',
    ],
    cta: 'Basic wählen',
  },
  {
    key: 'pro',
    name: 'Pro',
    description: 'Für den professionellen Privatverkauf.',
    features: [
      'Alles aus Basic',
      'Immowelt Listing (zusätzliches Portal)',
      'KI-Exposé Generator (PDF)',
      'KI-Preisrechner',
      'CRM-Lite (Interessenten & Termine)',
      'Energieausweis-Partner',
    ],
    cta: 'Pro wählen',
    recommended: true,
  },
  {
    key: 'premium',
    name: 'Premium',
    description: 'Maximale Reichweite, persönlicher Support.',
    features: [
      'Alles aus Pro',
      'Alle verfügbaren Portale + maximale Sichtbarkeit',
      'KI-Bildoptimierung',
      'Makler-Support (erste Stunde inklusive)',
    ],
    cta: 'Premium wählen',
  },
]

// ─── Vergleichstabelle ────────────────────────────────────────────────────────
type CompRow =
  | { feature: string; type: 'cost' }
  | { feature: string; type: 'value'; us: string; broker: string; competitor: string }

const COMPARISON_ROWS: CompRow[] = [
  { feature: 'Kosten', type: 'cost' },
  { feature: 'KI-Tools', type: 'value', us: '✓', broker: '—', competitor: '—' },
  { feature: 'Support', type: 'value', us: 'KI-Chatbot 24/7 + Makler buchbar', broker: 'Persönlich (Provision)', competitor: 'Mo–Fr 9–17 Uhr' },
  { feature: 'Makler-Support', type: 'value', us: '✓ Premium', broker: '✓', competitor: '—' },
  { feature: 'ImmoScout-Listing', type: 'value', us: '✓ Ab Basic', broker: '✓', competitor: '✓ Ab Paket 2' },
  { feature: 'Interessenten-CRM', type: 'value', us: '✓', broker: '—', competitor: '—' },
  { feature: 'Einmalige Zahlung', type: 'value', us: '✓', broker: '—', competitor: '✓' },
]

const COMPETITOR_COSTS: Record<Duration, string> = {
  1: '129–199 €',
  3: '199–399 €',
  6: '398–798 €',
}

function CellValue({ value, isUs }: { value: string; isUs?: boolean }) {
  if (value === '✓') {
    return (
      <span className="inline-flex items-center justify-center">
        <Check size={18} className={isUs ? 'text-accent' : 'text-text-secondary'} strokeWidth={2.5} aria-label="Ja" />
      </span>
    )
  }
  if (value === '—') {
    return (
      <span className="inline-flex items-center justify-center">
        <Minus size={16} className="text-text-tertiary" strokeWidth={2} aria-label="Nein" />
      </span>
    )
  }
  return (
    <span className={['text-[14px] font-semibold', isUs ? 'text-accent' : 'text-text-primary'].join(' ')}>
      {value}
    </span>
  )
}

// ─── Dialog-State ─────────────────────────────────────────────────────────────
interface WechselDialogState {
  aktuelles_paket: {
    tier: string
    laufzeit_monate: number
    ende_datum: string
    preis: number
    verbleibende_tage: number
    gesamt_tage: number
    restwert: number
  }
  neues_paket: {
    tier: Tier
    laufzeit_monate: Duration
    preis: number
  }
  aufpreis: number
}

interface DowngradeDialogState {
  grund: 'downgrade_tier' | 'downgrade_laufzeit' | 'identisch'
  aktuelles_paket: { tier: string; laufzeit_monate: number; ende_datum: string }
  neues_paket: { tier: Tier; laufzeit: Duration }
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────
export default function Pricing() {
  const [duration, setDuration] = useState<Duration>(3)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dialogState, setDialogState] = useState<WechselDialogState | null>(null)
  const [downgradeDialogState, setDowngradeDialogState] = useState<DowngradeDialogState | null>(null)

  async function handleCheckout(tier: Tier, laufzeit: Duration) {
    setLoading(`${tier}-${laufzeit}`)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'paket', tier, laufzeit }),
      })
      if (res.ok) {
        const data = await res.json()
        window.location.href = data.url
        return
      }
      if (res.status === 401) {
        window.location.href = `/login?tier=${tier}&laufzeit=${laufzeit}`
        return
      }
      if (res.status === 403) {
        const data = await res.json()
        setDowngradeDialogState({
          grund: data.grund,
          aktuelles_paket: data.aktuelles_paket,
          neues_paket: { tier, laufzeit },
        })
        return
      }
      if (res.status === 409) {
        const data = await res.json()
        setDialogState({
          aktuelles_paket: data.aktuelles_paket,
          neues_paket: data.neues_paket,
          aufpreis: data.aufpreis,
        })
        return
      }
      setError('Etwas ist schiefgelaufen, bitte versuche es erneut.')
    } finally {
      setLoading(null)
    }
  }

  async function handleAddonCheckout(addon_type: 'toolpaket' | 'maklerstunde') {
    setLoading(addon_type)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'addon', addon_type }),
      })
      if (res.ok) {
        const data = await res.json()
        window.location.href = data.url
        return
      }
      if (res.status === 401) {
        window.location.href = `/login?addon=${addon_type}`
        return
      }
      setError('Etwas ist schiefgelaufen, bitte versuche es erneut.')
    } finally {
      setLoading(null)
    }
  }

  async function handleCheckoutConfirmed() {
    if (!dialogState) return
    const tier = dialogState.neues_paket.tier
    const laufzeit = dialogState.neues_paket.laufzeit_monate
    setDialogState(null)
    setLoading(`${tier}-${laufzeit}`)
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
      setError('Etwas ist schiefgelaufen, bitte versuche es erneut.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      {/* Wechsel-Dialog (409) */}
      {dialogState && (
        <PaketWechselDialog
          open={true}
          onClose={() => setDialogState(null)}
          onConfirm={handleCheckoutConfirmed}
          aktuelles_paket={dialogState.aktuelles_paket}
          neues_paket={dialogState.neues_paket}
          restwert={dialogState.aktuelles_paket.restwert}
          aufpreis={dialogState.aufpreis}
        />
      )}

      {/* Downgrade-Dialog (403) */}
      {downgradeDialogState && (
        <DowngradeDialog
          open={true}
          onClose={() => setDowngradeDialogState(null)}
          grund={downgradeDialogState.grund}
          aktuelles_paket={downgradeDialogState.aktuelles_paket}
          neues_paket={downgradeDialogState.neues_paket}
        />
      )}

      {/* ── Pricing Section ───────────────────────────────────────────────── */}
      <section
        id="preise"
        className="section-padding bg-surface"
        aria-labelledby="pricing-heading"
      >
        <div className="container-landing">

          {/* Header */}
          <div className="text-center mb-10">
            <h2
              id="pricing-heading"
              className="text-[36px] md:text-[42px] font-bold text-text-primary headline-section mb-4"
            >
              Transparent. Einmalig. Fair.
            </h2>
            <p className="text-[17px] font-medium text-text-secondary max-w-[480px] mx-auto">
              Keine Provision, kein Abo. Du zahlst einmal und behältst alles.
            </p>
          </div>

          {/* Laufzeit-Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex gap-0.5 p-1 rounded-full bg-white border border-[#DDDDDD] mt-5">
              {([1, 3, 6] as Duration[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={[
                    'relative px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-150 min-h-[44px]',
                    duration === d
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary',
                  ].join(' ')}
                >
                  {d !== 1 && (
                    <span className="absolute -top-5 left-0 right-0 text-center text-[11px] font-semibold text-accent pointer-events-none">
                      spare {d === 3 ? '19%' : '34%'}
                    </span>
                  )}
                  {DURATION_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan) => {
              const price = PRICING[plan.key][duration]
              const saved = savings(plan.key, duration)
              const monthlyRate = monthly(plan.key, duration)
              const loadingKey = `${plan.key}-${duration}`
              const isLoading = loading === loadingKey

              return (
                <div
                  key={plan.name}
                  className={[
                    'relative bg-white rounded-card p-8 transition-all duration-200',
                    plan.recommended
                      ? 'border-2 border-accent shadow-hover'
                      : 'border border-[#DDDDDD] shadow-card hover:shadow-hover hover:-translate-y-0.5',
                  ].join(' ')}
                >
                  {/* Recommended badge */}
                  {plan.recommended && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center rounded-pill bg-accent px-4 py-1 text-white text-[12px] font-bold tracking-wide whitespace-nowrap">
                        Empfohlen
                      </span>
                    </div>
                  )}

                  {/* Plan name + savings badge */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-[16px] font-semibold text-text-secondary uppercase tracking-wider">
                      {plan.name}
                    </h3>
                    {saved !== null && (
                      <span className="inline-flex items-center rounded-full bg-accent-light text-accent text-[11px] font-semibold px-2.5 py-1 whitespace-nowrap">
                        Spare {saved} €
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-[48px] font-bold text-text-primary leading-none headline-display">
                      {price} €
                    </span>
                  </div>
                  <p className="text-[13px] font-medium text-text-tertiary mb-1">
                    {DURATION_LABELS[duration]} · {monthlyRate} €/Monat
                  </p>
                  <p className="text-[14px] font-medium text-text-secondary leading-snug mb-6">
                    {plan.description}
                  </p>

                  {/* Divider */}
                  <div className="border-t border-[#EEEEEE] mb-6" />

                  {/* Features */}
                  <ul className="space-y-3 mb-8" aria-label={`${plan.name}-Paket Funktionen`}>
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check
                          size={16}
                          className="text-accent flex-shrink-0 mt-0.5"
                          strokeWidth={2.5}
                          aria-hidden="true"
                        />
                        <span className="text-[14px] font-medium text-text-primary leading-snug">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    type="button"
                    disabled={loading !== null}
                    onClick={() => handleCheckout(plan.key, duration)}
                    className={[
                      'block w-full text-center rounded-pill text-[15px] font-semibold px-6 py-3.5 transition-colors duration-150 min-h-[48px]',
                      plan.recommended
                        ? 'bg-accent hover:bg-accent-hover text-white'
                        : 'border-2 border-[#222222] hover:bg-[#F7F7F7] text-text-primary',
                      loading !== null ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]',
                    ].join(' ')}
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Spinner /> Wird geladen…
                      </span>
                    ) : plan.cta}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Inline error */}
          {error && (
            <div className="mt-4 rounded-[8px] bg-[#FEF2F2] border border-error px-4 py-3 text-center">
              <p className="text-[13px] font-medium text-error">
                {error}{' '}
                <a href="mailto:kontakt@dubistdermakler.de" className="font-semibold underline">
                  kontakt@dubistdermakler.de
                </a>
              </p>
            </div>
          )}

          {/* Footer renewal note */}
          <p className="text-center text-[12px] font-medium text-text-tertiary mt-5">
            Nach Ablauf der Laufzeit werden deine Inserate automatisch von den Portalen genommen. Du kannst jederzeit reaktivieren oder ein neues Paket buchen — kein automatisches Abo.
          </p>

          {/* Tool-Paket Block */}
          <div className="mt-6 rounded-card bg-white border border-accent/30 p-6 flex flex-col md:flex-row items-start md:items-center gap-5">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} className="text-accent" aria-hidden="true" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="text-[15px] font-semibold text-text-primary">
                  Nur einzelne KI-Tools?
                </p>
                <span className="inline-flex items-center rounded-full bg-accent text-white text-[12px] font-bold px-3 py-0.5">
                  Tool-Paket ab 39 €
                </span>
              </div>
              <p className="text-[13px] font-medium text-text-secondary">
                Bewertung, KI-Exposé &amp; Inserat-Texte — einmalig. Wird beim späteren Paket-Kauf vollständig angerechnet.
              </p>
            </div>

            {/* CTA */}
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => handleAddonCheckout('toolpaket')}
              className={[
                'flex-shrink-0 inline-flex items-center gap-1.5 rounded-pill px-5 py-2.5 text-[14px] font-semibold transition-all duration-150 whitespace-nowrap md:ml-auto min-h-[44px] bg-accent text-white hover:bg-accent-hover',
                loading !== null ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]',
              ].join(' ')}
            >
              {loading === 'toolpaket' ? (
                <><Spinner /> Wird geladen…</>
              ) : (
                <>Tool-Paket ansehen <ArrowRight size={14} aria-hidden="true" /></>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ── Vergleichstabelle ─────────────────────────────────────────────── */}
      <section className="section-padding bg-white" aria-labelledby="comparison-heading">
        <div className="container-landing">

          <div className="text-center mb-16">
            <h2
              id="comparison-heading"
              className="text-[36px] md:text-[42px] font-bold text-text-primary headline-section mb-4"
            >
              Der direkte Vergleich
            </h2>
            <p className="text-[17px] font-medium text-text-secondary max-w-[480px] mx-auto">
              Warum klassische Makler und Billigportale beide nicht die Antwort sind.
            </p>
          </div>

          {/* Duration toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex gap-0.5 p-1 rounded-full bg-surface">
              {([1, 3, 6] as Duration[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={[
                    'px-5 py-2 rounded-full text-[14px] font-medium transition-all duration-150 min-h-[44px]',
                    duration === d
                      ? 'bg-accent text-white'
                      : 'text-text-secondary',
                  ].join(' ')}
                >
                  {DURATION_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-card border border-[#DDDDDD] shadow-card">
            <table
              className="w-full min-w-[560px]"
              aria-label="Vergleich: du bist der makler vs. Makler vs. Reines Listing-Portal"
            >
              <thead>
                <tr className="border-b border-[#EEEEEE]">
                  <th className="text-left text-[12px] font-semibold text-text-secondary uppercase tracking-wider py-4 px-6 bg-surface">
                    Merkmal
                  </th>
                  <th className="text-center text-[12px] font-bold text-accent uppercase tracking-wider py-4 px-6 bg-accent-light border-l-2 border-accent/30">
                    Wir ({DURATION_LABELS[duration]})
                  </th>
                  <th className="text-center text-[12px] font-semibold text-text-secondary uppercase tracking-wider py-4 px-6 bg-surface">
                    Klassischer Makler
                  </th>
                  <th className="text-center text-[12px] font-semibold text-text-secondary uppercase tracking-wider py-4 px-6 bg-surface">
                    Reines Listing-Portal
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                    <td className="text-[14px] font-semibold text-text-primary py-4 px-6 border-t border-[#EEEEEE]">
                      {row.type === 'cost' ? `Kosten (${DURATION_LABELS[duration]})` : row.feature}
                    </td>

                    <td className="text-center py-4 px-6 border-t border-[#EEEEEE] bg-accent-light/40 border-l-2 border-accent/20">
                      {row.type === 'cost'
                        ? <span className="text-[14px] font-semibold text-accent">ab {PRICING.basic[duration]} €</span>
                        : <CellValue value={row.us} isUs />
                      }
                    </td>

                    <td className="text-center py-4 px-6 border-t border-[#EEEEEE]">
                      {row.type === 'cost'
                        ? <span className="text-[14px] font-semibold text-error">12.000–24.000 €*</span>
                        : <CellValue value={row.broker} />
                      }
                    </td>

                    <td className="text-center py-4 px-6 border-t border-[#EEEEEE]">
                      {row.type === 'cost'
                        ? <span className="text-[14px] font-semibold text-text-primary">{COMPETITOR_COSTS[duration]}</span>
                        : <CellValue value={row.competitor} />
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[12px] font-medium text-text-tertiary mt-4 text-center">
            * Beispielrechnung: 400.000 € Kaufpreis × 3–6 % übliche Maklercourtage = 12.000–24.000 €. Tatsächliche Provision je nach Bundesland und Vereinbarung. Stand: 2026.
          </p>
        </div>
      </section>
    </>
  )
}
