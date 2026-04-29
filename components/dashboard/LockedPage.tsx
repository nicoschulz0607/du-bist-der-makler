import Link from 'next/link'
import { Lock, CheckCircle2, ArrowLeft } from 'lucide-react'

interface LockedPageProps {
  featureName: string
  requiredTier: 'pro' | 'premium'
  description: string
  benefits: string[]
  upgradePrice: string
}

export default function LockedPage({
  featureName,
  requiredTier,
  description,
  benefits,
  upgradePrice,
}: LockedPageProps) {
  const tierLabel = requiredTier === 'pro' ? 'Pro' : 'Premium'

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-white border border-[#DDDDDD] rounded-xl p-10 max-w-md w-full text-center shadow-sm">
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
            <Lock size={28} className="text-text-secondary" strokeWidth={1.5} />
          </div>
        </div>

        <div className="mb-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            requiredTier === 'pro'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {tierLabel}
          </span>
        </div>

        <h1 className="text-[22px] font-bold text-text-primary mt-3 mb-2" style={{ letterSpacing: '-0.18px' }}>
          {featureName}
        </h1>
        <p className="text-[15px] text-text-secondary mb-6 leading-relaxed">
          {description}
        </p>

        <ul className="text-left space-y-3 mb-8">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-accent flex-shrink-0 mt-0.5" strokeWidth={2} />
              <span className="text-[14px] font-medium text-text-primary">{benefit}</span>
            </li>
          ))}
        </ul>

        <Link
          href="/#preise"
          className="w-full inline-flex items-center justify-center rounded-pill bg-accent hover:bg-accent-hover text-white text-[15px] font-semibold px-6 min-h-[52px] transition-colors duration-150 active:scale-[0.98]"
        >
          Upgrade auf {tierLabel} ({upgradePrice}) →
        </Link>

        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-text-secondary hover:text-accent transition-colors duration-150"
        >
          <ArrowLeft size={14} />
          Zurück zur Übersicht
        </Link>
      </div>
    </div>
  )
}
