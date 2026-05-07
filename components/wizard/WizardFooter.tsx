'use client'

import { ChevronLeft, Sparkles } from 'lucide-react'

interface WizardFooterProps {
  currentStation: number
  canAdvance: boolean
  canSkip?: boolean
  skipLabel?: string
  onBack: () => void
  onNext: () => void
  onSkip?: () => void
  onKlara: () => void
  loading?: boolean
}

export default function WizardFooter({
  currentStation,
  canAdvance,
  canSkip,
  skipLabel = 'Überspringen',
  onBack,
  onNext,
  onSkip,
  onKlara,
  loading,
}: WizardFooterProps) {
  return (
    <footer className="flex items-center justify-between px-6 h-16 border-t border-[#EEEEEE] bg-white flex-shrink-0">
      <button
        type="button"
        onClick={onBack}
        disabled={currentStation === 1}
        className="flex items-center gap-1.5 text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} />
        Zurück
      </button>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onKlara}
          className="flex items-center gap-1.5 text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <Sparkles size={14} className="text-[#1B6B45]" />
          <span className="hidden sm:inline">Frage an Klara</span>
        </button>

        {canSkip && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            {skipLabel}
          </button>
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={!canAdvance || loading}
          className="px-5 py-2 bg-[#1B6B45] text-white text-[13px] font-semibold rounded-lg hover:bg-[#165c3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Bitte warten…' : currentStation === 12 ? 'Abschließen' : 'Weiter →'}
        </button>
      </div>
    </footer>
  )
}
