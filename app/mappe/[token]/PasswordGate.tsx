'use client'

import { useState, useTransition } from 'react'
import { Lock } from 'lucide-react'

interface PasswordGateProps {
  token: string
  action: (token: string, passwort: string) => Promise<{ fehler?: string }>
}

export default function PasswordGate({ token, action }: PasswordGateProps) {
  const [isPending, startTransition] = useTransition()
  const [passwort, setPasswort] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await action(token, passwort)
      if (result.fehler) setError('Falsches Passwort. Bitte erneut versuchen.')
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-[#EEEEEE] p-8 w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-[#1B6B45]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Lock size={22} strokeWidth={1.5} className="text-[#1B6B45]" />
        </div>
        <h1 className="text-[18px] font-bold text-gray-900 mb-1" style={{ letterSpacing: '-0.2px' }}>
          Passwort erforderlich
        </h1>
        <p className="text-[13px] text-gray-500 mb-6">
          Diese Dokumente-Mappe ist passwortgeschützt.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={passwort}
            onChange={(e) => setPasswort(e.target.value)}
            placeholder="Passwort eingeben"
            autoFocus
            className="w-full h-11 px-4 rounded-xl border border-gray-200 text-[13px] text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-[#1B6B45]/30"
          />
          {error && <p className="text-[12px] text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isPending || !passwort}
            className="w-full py-3 rounded-xl bg-[#1B6B45] text-white text-[13px] font-semibold hover:bg-[#1B6B45]/90 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Prüfe…' : 'Zugang öffnen'}
          </button>
        </form>
      </div>
    </div>
  )
}
