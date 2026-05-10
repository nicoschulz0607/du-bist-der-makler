'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { canAccessFeature } from '@/lib/feature-gates'
import FotoAufwertung from './tabs/FotoAufwertung'
import VirtualStaging from './tabs/VirtualStaging'
import Aussenaufnahmen from './tabs/Aussenaufnahmen'
import type { Tier } from '@/lib/tier'

type TabId = 'foto' | 'staging' | 'outdoor'

interface BildtoolsClientProps {
  tier: Tier
  userId: string
  initialTab: TabId
  counts: { enhance: number; staging: number; outdoor: number }
}

const TABS: { id: TabId; label: string; feature: 'enhance' | 'staging' | 'outdoor' }[] = [
  { id: 'foto', label: 'Foto-Aufwertung', feature: 'enhance' },
  { id: 'staging', label: 'Virtual Staging', feature: 'staging' },
  { id: 'outdoor', label: 'Außenaufnahmen', feature: 'outdoor' },
]

export default function BildtoolsClient({ tier, userId, initialTab, counts }: BildtoolsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)

  function switchTab(id: TabId) {
    setActiveTab(id)
    router.push(`/dashboard/bildtools?tab=${id}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 bg-surface rounded-xl p-1 overflow-x-auto">
        {TABS.map(({ id, label, feature }) => {
          const locked = !canAccessFeature(tier, feature)
          const isActive = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => switchTab(id)}
              className={[
                'flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-colors duration-150 whitespace-nowrap',
                isActive
                  ? 'bg-white shadow-[var(--shadow-subtle)] text-text-primary'
                  : 'text-text-secondary hover:text-text-primary',
              ].join(' ')}
            >
              {label}
              {locked && (
                <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                  {feature === 'enhance' ? 'Pro' : 'Premium'}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content — each tab handles its own locked state internally */}
      <div>
        {activeTab === 'foto' && (
          <FotoAufwertung
            tier={tier}
            userId={userId}
            count={counts.enhance}
            isLocked={!canAccessFeature(tier, 'enhance')}
          />
        )}
        {activeTab === 'staging' && (
          <VirtualStaging
            userId={userId}
            count={counts.staging}
            tier={tier}
            isLocked={!canAccessFeature(tier, 'staging')}
          />
        )}
        {activeTab === 'outdoor' && (
          <Aussenaufnahmen
            userId={userId}
            count={counts.outdoor}
            tier={tier}
            isLocked={!canAccessFeature(tier, 'outdoor')}
          />
        )}
      </div>
    </div>
  )
}
