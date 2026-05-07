'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

interface WizardHeaderProps {
  currentStation: number
  totalStations: number
}

export default function WizardHeader({ currentStation, totalStations }: WizardHeaderProps) {
  const router = useRouter()

  return (
    <header className="flex items-center justify-between px-6 h-[60px] border-b border-[#EEEEEE] bg-white flex-shrink-0">
      <Link href="/" className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-[#1B6B45] flex-shrink-0" />
        <span className="text-[14px] font-bold text-text-primary tracking-tight hidden sm:block">
          du bist der makler
        </span>
      </Link>

      <div className="flex items-center gap-4">
        <span className="text-[13px] text-text-secondary">
          Schritt{' '}
          <span className="font-semibold text-text-primary">{currentStation}</span>
          {' '}von{' '}
          <span className="font-semibold text-text-primary">{totalStations}</span>
        </span>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <X size={14} />
          <span className="hidden sm:inline">Wizard verlassen</span>
        </button>
      </div>
    </header>
  )
}
