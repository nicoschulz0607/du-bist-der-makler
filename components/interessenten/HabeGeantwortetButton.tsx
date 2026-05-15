'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Undo2 } from 'lucide-react'
import { markiereBeantwortet, widerrufBeantwortet } from '@/app/dashboard/interessenten/[id]/actions'

interface Props {
  interessentId: string
  antwortetAm: string | null
}

function formatGeantwortetAm(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDay = new Date(date)
  targetDay.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24))

  const uhrzeit = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

  if (diffDays === 0) return `heute ${uhrzeit}`
  if (diffDays === 1) return `gestern ${uhrzeit}`

  const tag = String(date.getDate()).padStart(2, '0')
  const monat = String(date.getMonth() + 1).padStart(2, '0')
  return `${tag}.${monat}. ${uhrzeit}`
}

export default function HabeGeantwortetButton({ interessentId, antwortetAm }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (antwortetAm) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-[#1B6B45]/5 border border-[#1B6B45]/20 rounded-xl">
        <CheckCircle2 size={18} className="text-[#1B6B45] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-[#1B6B45]">Geantwortet</p>
          <p className="text-[12px] text-text-secondary mt-0.5">
            {formatGeantwortetAm(antwortetAm)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null)
            startTransition(async () => {
              const res = await widerrufBeantwortet(interessentId)
              if ('error' in res) setError(res.error)
            })
          }}
          disabled={pending}
          className="flex items-center gap-1 text-[12px] text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
          aria-label="Rückgängig machen"
        >
          <Undo2 size={12} />
          {pending ? 'Wird...' : 'Rückgängig'}
        </button>
        {error && <p className="text-[11px] text-[#D04A2C]">{error}</p>}
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const res = await markiereBeantwortet(interessentId)
            if ('error' in res) setError(res.error)
          })
        }}
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1B6B45] text-white rounded-xl font-medium hover:bg-[#145538] transition-colors disabled:opacity-50"
      >
        <CheckCircle2 size={18} />
        {pending ? 'Wird gespeichert...' : 'Habe geantwortet'}
      </button>
      {error && <p className="text-[12px] text-[#D04A2C] mt-2">{error}</p>}
    </div>
  )
}
