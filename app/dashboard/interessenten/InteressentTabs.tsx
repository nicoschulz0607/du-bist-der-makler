'use client'

import { MessageSquare, User, Sparkles, TrendingUp } from 'lucide-react'
import TabNachricht from './TabNachricht'
import TabDaten from './TabDaten'
import TabKiAuswertung from './TabKiAuswertung'
import TabAngebote from './TabAngebote'

interface Props {
  interessent: Record<string, unknown>
  activeTab: string
  tier: string
  onTabChange: (tab: string) => void
}

const TABS = [
  { id: 'nachricht', label: 'Nachricht', icon: MessageSquare },
  { id: 'daten', label: 'Daten', icon: User },
  { id: 'ki', label: 'KI-Auswertung', icon: Sparkles },
  { id: 'angebote', label: 'Angebote', icon: TrendingUp },
]

export default function InteressentTabs({ interessent, activeTab, tier, onTabChange }: Props) {
  return (
    <>
      <div className="flex border-t border-b border-gray-200 bg-gray-50 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap
                ${active
                  ? 'border-[#1B6B45] text-[#1B6B45] bg-white'
                  : 'border-transparent text-text-secondary hover:text-text-primary'}
              `}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className="p-4">
        {activeTab === 'nachricht' && <TabNachricht interessent={interessent} />}
        {activeTab === 'daten' && <TabDaten interessent={interessent} />}
        {activeTab === 'ki' && <TabKiAuswertung interessent={interessent} tier={tier} />}
        {activeTab === 'angebote' && <TabAngebote interessent={interessent} />}
      </div>
    </>
  )
}
