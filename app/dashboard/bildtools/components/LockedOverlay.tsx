import Link from 'next/link'
import { Lock } from 'lucide-react'
import { getUpgradeDiffCent, formatPreisEuro } from '@/lib/pricing'
import type { Tier } from '@/lib/tier'

const LAUFZEITEN = [1, 3, 6] as const
const LAUFZEIT_LABELS: Record<number, string> = { 1: '1 Monat', 3: '3 Monate', 6: '6 Monate' }

interface LockedOverlayProps {
  requiredTier: 'pro' | 'premium'
  currentTier: Tier
  feature: string
}

export default function LockedOverlay({ requiredTier, currentTier, feature }: LockedOverlayProps) {
  const fromTier = (currentTier ?? 'basic') as 'basic' | 'pro'
  const tierLabel = requiredTier === 'pro' ? 'Pro' : 'Premium'

  return (
    <div className="relative">
      {/* Invisible placeholder preserving drop-zone height */}
      <div className="min-h-[140px] rounded-xl border-2 border-dashed border-border" aria-hidden />

      {/* Glass overlay */}
      <div
        className="absolute inset-0 z-10 flex items-center justify-center rounded-xl"
        style={{
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(255,255,255,0.85)',
        }}
      >
        <div className="bg-white rounded-2xl border border-[#DDDDDD] shadow-[var(--shadow-card)] p-6 mx-4 max-w-[320px] w-full text-center space-y-4">
          <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mx-auto">
            <Lock size={18} className="text-text-secondary" strokeWidth={1.75} />
          </div>

          <p className="text-[16px] font-bold text-text-primary">
            {feature} gibt&apos;s mit {tierLabel}
          </p>

          <div className="text-left space-y-2">
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Aufpreis je nach Laufzeit
            </p>
            {LAUFZEITEN.map((laufzeit) => {
              const diff = getUpgradeDiffCent(fromTier, requiredTier, laufzeit)
              return (
                <div key={laufzeit} className="flex justify-between items-center">
                  <span className="text-[13px] text-text-secondary">{LAUFZEIT_LABELS[laufzeit]}</span>
                  <span className="text-[13px] font-semibold text-text-primary">+{formatPreisEuro(diff)}</span>
                </div>
              )
            })}
          </div>

          <Link
            href="/#preise"
            className="w-full inline-flex items-center justify-center rounded-pill bg-accent hover:bg-accent-hover text-white text-[14px] font-semibold px-5 h-11 transition-colors duration-150 active:scale-[0.98]"
          >
            Auf {tierLabel} upgraden →
          </Link>
        </div>
      </div>
    </div>
  )
}
