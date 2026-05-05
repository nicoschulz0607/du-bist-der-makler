'use client'

import { Sparkles } from 'lucide-react'

type Props = {
  prefilledQuestion: string
  label?: string
  compact?: boolean
}

export default function InlineButton({ prefilledQuestion, label = 'Frag Klara', compact = false }: Props) {
  function handleClick() {
    window.dispatchEvent(
      new CustomEvent('klara:prefill', { detail: { question: prefilledQuestion } })
    )
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-text-tertiary hover:text-accent hover:bg-accent-light transition-colors"
        title={`Klara fragen: ${prefilledQuestion}`}
      >
        <Sparkles size={12} strokeWidth={2} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium text-accent bg-accent-light hover:bg-[#D4EDDF] transition-colors"
    >
      <Sparkles size={12} strokeWidth={2} />
      {label}
    </button>
  )
}
