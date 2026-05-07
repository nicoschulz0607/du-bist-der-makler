'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Wunschtermin = { datum: string; tageszeit: string }

const TAGESZEIT_TIME: Record<string, string> = {
  vormittags: '10:00',
  nachmittags: '14:00',
  abends: '18:00',
  'wochenende-flexibel': '10:00',
}

const TAGESZEIT_LABELS: Record<string, string> = {
  vormittags: 'Vormittags (ca. 10 Uhr)',
  nachmittags: 'Nachmittags (ca. 14 Uhr)',
  abends: 'Abends (ca. 18 Uhr)',
  'wochenende-flexibel': 'Wochenende – flexibel',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

interface Props {
  anfrageId: string
  status: string
  wunschtermine: Wunschtermin[]
}

export default function AdminAnfrageActions({ anfrageId, status, wunschtermine }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [notiz, setNotiz] = useState('')
  const [alternativer_termin, setAlternativerTermin] = useState('')
  const [mode, setMode] = useState<'default' | 'ablehnen' | 'alternativ'>('default')
  const [error, setError] = useState<string | null>(null)

  async function doFetch(url: string, body: object) {
    setError(null)
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Fehler beim Speichern')
      return false
    }
    return true
  }

  function bestätigenMitWunschtermin(t: Wunschtermin) {
    const time = TAGESZEIT_TIME[t.tageszeit] ?? '10:00'
    const isoTermin = `${t.datum}T${time}:00.000Z`
    startTransition(async () => {
      const ok = await doFetch(`/api/admin/makler-anfragen/${anfrageId}/bestätigen`, {
        bestätigter_termin: new Date(`${t.datum}T${time}`).toISOString(),
        admin_notiz: notiz || undefined,
      })
      if (ok) router.refresh()
    })
  }

  function bestätigenAlternativ() {
    if (!alternativer_termin) { setError('Bitte einen Termin eingeben'); return }
    startTransition(async () => {
      const ok = await doFetch(`/api/admin/makler-anfragen/${anfrageId}/bestätigen`, {
        bestätigter_termin: new Date(alternativer_termin).toISOString(),
        admin_notiz: notiz || undefined,
      })
      if (ok) router.refresh()
    })
  }

  function ablehnen() {
    startTransition(async () => {
      const ok = await doFetch(`/api/admin/makler-anfragen/${anfrageId}/ablehnen`, {
        admin_notiz: notiz || undefined,
      })
      if (ok) router.refresh()
    })
  }

  function abschließen() {
    startTransition(async () => {
      const ok = await doFetch(`/api/admin/makler-anfragen/${anfrageId}/abschließen`, {})
      if (ok) router.refresh()
    })
  }

  const inputBase = 'w-full rounded-[8px] border border-[#DDDDDD] px-4 py-2.5 text-[14px] text-text-primary bg-white focus:outline-none focus:border-[#1B6B45] transition-colors'

  if (status === 'abgeschlossen' || status === 'abgelehnt') {
    return (
      <div className="bg-[#F9F9F9] rounded-xl border border-[#EEEEEE] p-5 text-center">
        <p className="text-[14px] text-text-secondary">Diese Anfrage ist abgeschlossen.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#EEEEEE] p-5 space-y-4">
      <p className="text-[13px] font-semibold text-text-secondary uppercase tracking-wider">Aktionen</p>

      {error && (
        <p className="text-[13px] text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
      )}

      {/* Optionale Notiz */}
      <div>
        <label className="block text-[13px] font-medium text-text-secondary mb-1">
          Notiz an Kunden (optional)
        </label>
        <textarea
          value={notiz}
          onChange={(e) => setNotiz(e.target.value)}
          rows={2}
          placeholder="Hinweis, Erklärung, ..."
          className={inputBase}
        />
      </div>

      {status === 'neu' && mode === 'default' && (
        <div className="space-y-3">
          {/* Wunschtermine bestätigen */}
          {wunschtermine.map((t, i) => (
            <button
              key={i}
              type="button"
              disabled={isPending}
              onClick={() => bestätigenMitWunschtermin(t)}
              className="w-full text-left flex items-center justify-between gap-3 rounded-[10px] border border-[#1B6B45] bg-[#E8F5EE] px-4 py-3 hover:bg-[#D4EDDF] transition-colors disabled:opacity-50"
            >
              <span className="text-[14px] font-medium text-[#1B6B45]">
                Wunschtermin {i + 1} bestätigen
              </span>
              <span className="text-[13px] text-[#1B6B45]/70">
                {formatDate(t.datum)} — {TAGESZEIT_LABELS[t.tageszeit] ?? t.tageszeit}
              </span>
            </button>
          ))}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode('alternativ')}
              className="flex-1 rounded-[10px] border border-[#DDDDDD] bg-white px-4 py-2.5 text-[14px] font-medium text-text-primary hover:border-[#1B6B45] hover:text-[#1B6B45] transition-colors"
            >
              Alternative vorschlagen
            </button>
            <button
              type="button"
              onClick={() => setMode('ablehnen')}
              className="flex-1 rounded-[10px] border border-[#DDDDDD] bg-white px-4 py-2.5 text-[14px] font-medium text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors"
            >
              Ablehnen
            </button>
          </div>
        </div>
      )}

      {status === 'neu' && mode === 'alternativ' && (
        <div className="space-y-3">
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-1">
              Alternativer Termin
            </label>
            <input
              type="datetime-local"
              value={alternativer_termin}
              onChange={(e) => setAlternativerTermin(e.target.value)}
              className={inputBase}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode('default')}
              className="px-4 py-2.5 rounded-[8px] border border-[#DDDDDD] text-[14px] text-text-secondary hover:text-text-primary transition-colors"
            >
              Zurück
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={bestätigenAlternativ}
              className="flex-1 rounded-[10px] bg-[#1B6B45] text-white px-4 py-2.5 text-[14px] font-semibold hover:bg-[#15563A] transition-colors disabled:opacity-50"
            >
              {isPending ? 'Wird bestätigt…' : 'Termin bestätigen'}
            </button>
          </div>
        </div>
      )}

      {status === 'neu' && mode === 'ablehnen' && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode('default')}
              className="px-4 py-2.5 rounded-[8px] border border-[#DDDDDD] text-[14px] text-text-secondary hover:text-text-primary transition-colors"
            >
              Zurück
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={ablehnen}
              className="flex-1 rounded-[10px] bg-red-600 text-white px-4 py-2.5 text-[14px] font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Wird abgelehnt…' : 'Anfrage ablehnen'}
            </button>
          </div>
        </div>
      )}

      {status === 'bestätigt' && (
        <button
          type="button"
          disabled={isPending}
          onClick={abschließen}
          className="w-full rounded-[10px] border border-[#DDDDDD] bg-[#F9F9F9] px-4 py-2.5 text-[14px] font-medium text-text-secondary hover:text-text-primary hover:border-[#BBBBBB] transition-colors disabled:opacity-50"
        >
          {isPending ? 'Wird gespeichert…' : 'Als abgeschlossen markieren'}
        </button>
      )}
    </div>
  )
}
