'use client'

import { useState, useTransition } from 'react'
import { X, Loader2 } from 'lucide-react'

const inputBase =
  'w-full rounded-[8px] border border-[#DDDDDD] px-4 min-h-[44px] text-[14px] text-text-primary bg-white outline-none transition-all placeholder:text-text-tertiary focus:ring-2 focus:ring-accent focus:border-transparent'

interface Props {
  interessentId: string
  onClose: () => void
  onSuccess: (betrag: number) => void
  onSubmit: (interessentId: string, betrag: number, kommentar?: string) => Promise<{ ok: boolean; error?: string }>
}

export default function NeuesAngebotModal({ interessentId, onClose, onSuccess, onSubmit }: Props) {
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    const fd = new FormData(e.currentTarget)
    const betragStr = fd.get('betrag') as string
    const betrag = Number(betragStr)
    if (!betrag || betrag <= 0) {
      setFormError('Bitte einen gültigen Betrag eingeben.')
      return
    }
    const kommentar = (fd.get('kommentar') as string) || undefined
    startTransition(async () => {
      const result = await onSubmit(interessentId, betrag, kommentar)
      if (!result.ok) {
        setFormError(result.error ?? 'Fehler beim Speichern')
        return
      }
      onSuccess(betrag)
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEEEEE]">
          <h2 className="text-[16px] font-bold text-text-primary">Neues Angebot eintragen</h2>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <p className="text-[13px] text-[#C13515] bg-[#FDECEA] rounded-lg px-3 py-2">{formError}</p>
          )}
          <div>
            <label className="block text-[13px] font-semibold text-text-primary mb-1.5">
              Angebotsbetrag *
            </label>
            <div className="relative">
              <input
                name="betrag"
                type="number"
                step="1"
                min="1"
                required
                placeholder="480000"
                className={`${inputBase} pr-8`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-[14px] pointer-events-none">
                €
              </span>
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-text-primary mb-1.5">
              Kommentar (optional)
            </label>
            <textarea
              name="kommentar"
              rows={3}
              placeholder="z. B. telefonisch besprochen, Finanzierung läuft…"
              className={`${inputBase} py-3 resize-none min-h-[80px]`}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] rounded-[8px] border border-[#DDDDDD] text-[14px] font-semibold text-text-primary hover:bg-surface transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 min-h-[44px] rounded-[8px] bg-[#1B6B45] hover:bg-[#145538] text-white text-[14px] font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Angebot speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
