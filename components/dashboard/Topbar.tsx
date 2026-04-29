'use client'

import Link from 'next/link'
import { Bell, PenSquare } from 'lucide-react'
import { type Tier } from '@/lib/tier'

function getGreeting(name: string): string {
  const h = new Date().getHours()
  if (h < 12) return `Guten Morgen, ${name} 👋`
  if (h < 18) return `Guten Tag, ${name} 👋`
  return `Guten Abend, ${name} 👋`
}

interface TopbarProps {
  vorname: string
  tier: Tier
}

export default function Topbar({ vorname, tier }: TopbarProps) {
  return (
    <header className="bg-white border-b border-[#EEEEEE] h-16 flex items-center justify-between px-8 flex-shrink-0">
      <div>
        <p className="text-[15px] font-semibold text-text-primary leading-tight">
          {getGreeting(vorname ?? 'du')}
        </p>
        <p className="text-[13px] text-text-secondary">
          Hier ist dein aktueller Stand
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface transition-colors duration-150 text-text-secondary"
          aria-label="Benachrichtigungen"
        >
          <Bell size={18} strokeWidth={1.5} />
        </button>

        <Link
          href="/dashboard/objekt"
          className="inline-flex items-center gap-2 rounded-pill bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold px-4 h-9 transition-colors duration-150 active:scale-[0.98]"
        >
          <PenSquare size={14} strokeWidth={2} />
          Inserat bearbeiten
        </Link>
      </div>
    </header>
  )
}
