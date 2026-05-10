import Link from 'next/link'
import { Lock } from 'lucide-react'
import { getUpgradeDiffCent, formatPreisEuro } from '@/lib/pricing'
import type { Tier } from '@/lib/tier'

interface LockedTabOverlayProps {
  requiredTier: 'pro' | 'premium'
  currentTier: Tier
  featureName: string
}

export default function LockedTabOverlay({ requiredTier, currentTier, featureName }: LockedTabOverlayProps) {
  const fromTier = (currentTier ?? 'basic') as 'basic' | 'pro'
  const diff = getUpgradeDiffCent(fromTier, requiredTier)
  const tierLabel = requiredTier === 'premium' ? 'Premium' : 'Pro'

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 rounded-xl"
      style={{
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        backgroundColor: 'rgba(255,255,255,0.78)',
      }}
    >
      <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
        <Lock size={20} className="text-text-secondary" strokeWidth={1.75} />
      </div>

      <div className="text-center max-w-xs px-4">
        <p className="text-[17px] font-bold text-text-primary headline-sub">
          {featureName}
        </p>
        <p className="text-[14px] text-text-secondary mt-1">
          Nur im {tierLabel}-Paket verfügbar. Jetzt upgraden und sofort nutzen.
        </p>
      </div>

      <Link
        href="/#preise"
        className="inline-flex items-center gap-2 rounded-pill bg-accent hover:bg-accent-hover text-white text-[14px] font-semibold px-5 h-11 transition-colors duration-150 active:scale-[0.98]"
      >
        Upgrade auf {tierLabel} · +{formatPreisEuro(diff)} →
      </Link>
    </div>
  )
}
