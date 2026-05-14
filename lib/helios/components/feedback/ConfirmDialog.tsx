'use client'

import { useRef, useState, useTransition, type ReactNode } from 'react'
import type { ActionResult } from '@/app/helios/actions'

interface ConfirmDialogProps {
  trigger: ReactNode
  title: string
  description: string
  onConfirm: () => Promise<ActionResult>
  actionLabel?: string
  variant?: 'danger' | 'primary'
  confirmText?: string  // if set: user must type this exact string to enable confirm
  onResult?: (result: ActionResult) => void
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  onConfirm,
  actionLabel = 'Bestätigen',
  variant = 'primary',
  confirmText,
  onResult,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [isPending, startTransition] = useTransition()

  const canConfirm = !confirmText || inputValue === confirmText

  function open() {
    setInputValue('')
    dialogRef.current?.showModal()
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await onConfirm()
      dialogRef.current?.close()
      onResult?.(result)
    })
  }

  const confirmBtnClass = [
    'px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
    variant === 'danger'
      ? 'bg-helios-danger text-white hover:opacity-90'
      : 'bg-helios-accent text-white hover:bg-helios-accent-hover',
  ].join(' ')

  return (
    <>
      <span onClick={open} className="contents">
        {trigger}
      </span>

      <dialog
        ref={dialogRef}
        className="helios-dialog rounded-xl border border-helios-border bg-helios-bg shadow-lg p-6 w-full max-w-md open:flex open:flex-col open:gap-4"
      >
        <h3 className="text-base font-semibold text-helios-text">{title}</h3>
        <p className="text-sm text-helios-text-muted">{description}</p>

        {confirmText && (
          <div>
            <label className="block text-xs font-medium text-helios-text-muted mb-1">
              Zur Bestätigung eingeben: <span className="font-semibold text-helios-text">{confirmText}</span>
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full rounded-lg border border-helios-border bg-helios-surface px-3 py-2 text-sm text-helios-text focus:outline-none focus:ring-2 focus:ring-helios-accent"
              placeholder={confirmText}
              autoComplete="off"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <form method="dialog">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium text-helios-text-muted hover:text-helios-text hover:bg-helios-surface-muted transition-colors"
            >
              Abbrechen
            </button>
          </form>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || isPending}
            className={confirmBtnClass}
          >
            {isPending ? 'Wird ausgeführt…' : actionLabel}
          </button>
        </div>
      </dialog>
    </>
  )
}
