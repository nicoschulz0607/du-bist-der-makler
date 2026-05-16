'use client'

import { useState, useTransition } from 'react'
import { X, Loader2 } from 'lucide-react'

const inputBase =
  'w-full rounded-[8px] border border-[#DDDDDD] px-4 min-h-[44px] text-[14px] text-text-primary bg-white outline-none transition-all placeholder:text-text-tertiary focus:ring-2 focus:ring-accent focus:border-transparent'

interface Props {
  onCreate: (formData: FormData) => Promise<{ ok: boolean; id?: string; error?: string }>
  onClose: () => void
}

export default function InteressentCreateModal({ onCreate, onClose }: Props) {
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await onCreate(fd)
      if (!result.ok) {
        setFormError(result.error ?? 'Fehler')
        return
      }
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEEEEE]">
          <h2 className="text-[16px] font-bold text-text-primary">Neuer Interessent</h2>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          {formError && (
            <p className="text-[13px] text-[#C13515] bg-[#FDECEA] rounded-lg px-3 py-2">{formError}</p>
          )}
          <div>
            <label className="block text-[13px] font-semibold text-text-primary mb-1.5">Name *</label>
            <input name="name" type="text" required placeholder="Max Mustermann" className={inputBase} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-text-primary mb-1.5">E-Mail</label>
            <input name="email" type="email" placeholder="max@beispiel.de" className={inputBase} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-text-primary mb-1.5">Telefon</label>
            <input name="telefon" type="tel" placeholder="0171 1234567" className={inputBase} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-text-primary mb-1.5">Quelle</label>
            <select name="quelle" className={inputBase}>
              <option value="manuell">Manuell</option>
              <option value="eigene_seite">Eigene Seite</option>
              <option value="immoscout">ImmoScout</option>
              <option value="kleinanzeigen">Kleinanzeigen</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-text-primary mb-1.5">Nachricht (optional)</label>
            <textarea
              name="nachricht"
              rows={3}
              placeholder="Erste Nachricht des Interessenten…"
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
              className="flex-1 min-h-[44px] rounded-[8px] bg-accent hover:bg-accent-hover text-white text-[14px] font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Anlegen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
