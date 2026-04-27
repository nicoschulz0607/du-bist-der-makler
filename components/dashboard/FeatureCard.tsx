import Link from 'next/link'
import { Lock } from 'lucide-react'
import { canAccess, type Tier } from '@/lib/tier'

interface FeatureCardProps {
  icon: React.ReactNode
  iconBg: string
  title: string
  description: string
  href: string
  requiredTier: 'starter' | 'pro' | 'premium'
  currentTier: Tier
  badge?: string
}

export default function FeatureCard({
  icon,
  iconBg,
  title,
  description,
  href,
  requiredTier,
  currentTier,
  badge,
}: FeatureCardProps) {
  const accessible = canAccess(currentTier, requiredTier)
  const upgradeTarget = requiredTier === 'premium' ? 'premium' : 'pro'

  return (
    <div className="relative">
      <Link
        href={accessible ? href : `/onboarding?upgrade=${upgradeTarget}`}
        className={`block bg-white border border-[#DDDDDD] rounded-xl p-6 transition-all duration-150 ${
          accessible
            ? 'hover:border-accent hover:shadow-sm hover:-translate-y-px'
            : 'cursor-pointer'
        }`}
      >
        {!accessible && (
          <div className="absolute inset-0 rounded-xl bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 gap-3">
            <Lock size={20} className="text-text-secondary" strokeWidth={1.5} />
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              upgradeTarget === 'premium'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {upgradeTarget === 'premium' ? 'Premium' : 'Pro'} freischalten →
            </span>
          </div>
        )}

        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${iconBg}`}>
          {icon}
        </div>

        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-[15px] font-semibold text-text-primary">{title}</h3>
          {badge && (
            <span className={`flex-shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              badge === 'Premium'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-[13px] text-text-secondary leading-relaxed">{description}</p>
      </Link>
    </div>
  )
}
