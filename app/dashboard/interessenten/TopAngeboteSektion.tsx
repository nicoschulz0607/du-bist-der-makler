'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface TopAngebot {
  id: string
  name: string
  betrag: number
  bonitaet: string | null
  bankbestaetigung: boolean
}

interface Props {
  angebote: TopAngebot[]
  listingPreis: number | null
  onSelect: (id: string) => void
}

const BONITAET_DISPLAY: Record<string, { label: string; color: string }> = {
  bestaetigt: { label: '✓ Bonität', color: '#1B6B45' },
  unklar: { label: '⚠ Bonität', color: '#C07000' },
  kritisch: { label: '✗ Bonität', color: '#D04A2C' },
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function PreisDelta({ betrag, listingPreis }: { betrag: number; listingPreis: number | null }) {
  if (!listingPreis) return null
  const pct = ((betrag / listingPreis) - 1) * 100
  const abs = Math.abs(pct)
  const formatted = abs < 0.1 ? '±0%' : `${pct > 0 ? '+' : '−'}${abs.toFixed(1)}%`

  if (abs < 0.1) {
    return (
      <span className="flex items-center gap-0.5 text-[11px] text-text-tertiary">
        <Minus size={10} /> {formatted}
      </span>
    )
  }
  if (pct > 0) {
    return (
      <span className="flex items-center gap-0.5 text-[11px] font-medium text-[#1B6B45]">
        <TrendingUp size={10} /> {formatted}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-0.5 text-[11px] font-medium text-[#C07000]">
      <TrendingDown size={10} /> {formatted}
    </span>
  )
}

export default function TopAngeboteSektion({ angebote, listingPreis, onSelect }: Props) {
  if (angebote.length === 0) return null

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
          Top-Angebote
        </p>
      </div>
      <div className="divide-y divide-gray-100">
        {angebote.map(a => {
          const bonitaet = a.bonitaet ? BONITAET_DISPLAY[a.bonitaet] : null
          return (
            <button
              key={a.id}
              onClick={() => onSelect(a.id)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-[13px] font-medium text-text-primary truncate max-w-[120px]">
                {a.name}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[14px] font-bold text-text-primary">
                  {formatPrice(a.betrag)}
                </span>
                <PreisDelta betrag={a.betrag} listingPreis={listingPreis} />
                <div className="flex items-center gap-1">
                  {bonitaet && (
                    <span className="text-[11px] font-medium" style={{ color: bonitaet.color }}>
                      {bonitaet.label}
                    </span>
                  )}
                  {a.bankbestaetigung && (
                    <span className="text-[11px] font-medium text-[#1B6B45]">✓ Bank</span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
