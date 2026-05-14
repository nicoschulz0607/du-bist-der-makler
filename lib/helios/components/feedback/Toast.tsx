'use client'

import { useEffect } from 'react'
import type { ActionResult } from '@/app/helios/actions'

interface ToastProps {
  result: ActionResult | null
  onDismiss?: () => void
}

export function Toast({ result, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!result) return
    const timer = setTimeout(() => onDismiss?.(), 3000)
    return () => clearTimeout(timer)
  }, [result, onDismiss])

  if (!result) return null

  return (
    <div
      className={[
        'fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg',
        'bg-helios-surface max-w-sm text-sm',
        result.ok
          ? 'border-helios-success text-helios-success'
          : 'border-helios-danger text-helios-danger',
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <span className="font-medium leading-5">{result.message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-auto shrink-0 text-helios-text-subtle hover:text-helios-text leading-none"
          aria-label="Schließen"
        >
          ✕
        </button>
      )}
    </div>
  )
}
