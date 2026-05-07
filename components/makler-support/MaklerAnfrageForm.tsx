'use client'

import { useState } from 'react'
import { Plus, Trash2, CheckCircle2 } from 'lucide-react'

type Wunschtermin = { datum: string; tageszeit: string }

const THEMEN = [
  { value: 'preisverhandlung', label: 'Preisverhandlung' },
  { value: 'vertragsfragen', label: 'Vertragsfragen' },
  { value: 'besichtigung', label: 'Besichtigung vorbereiten' },
  { value: 'sonstiges', label: 'Sonstiges' },
]

const TAGESZEITEN = [
  { value: 'abends', label: 'Abends (ca. 18–20 Uhr)' },
  { value: 'wochenende-flexibel', label: 'Wochenende – flexibel' },
  { value: 'vormittags', label: 'Vormittags (ca. 10 Uhr, nur Wochenende)' },
  { value: 'nachmittags', label: 'Nachmittags (ca. 14 Uhr, nur Wochenende)' },
]

function isWeekday(dateStr: string): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const day = d.getDay()
  return day !== 0 && day !== 6
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

interface Props {
  listingId?: string | null
}

export default function MaklerAnfrageForm({ listingId }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [thema, setThema] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [telefon, setTelefon] = useState('')
  const [wunschtermine, setWunschtermine] = useState<Wunschtermin[]>([{ datum: '', tageszeit: 'abends' }])

  const inputBase = 'w-full rounded-[8px] border border-[#DDDDDD] px-4 min-h-[52px] text-[14px] text-text-primary bg-white focus:outline-none focus:border-[#1B6B45] transition-colors'

  function addSlot() {
    if (wunschtermine.length < 3) {
      setWunschtermine([...wunschtermine, { datum: '', tageszeit: 'abends' }])
    }
  }

  function removeSlot(idx: number) {
    setWunschtermine(wunschtermine.filter((_, i) => i !== idx))
  }

  function updateSlot(idx: number, field: keyof Wunschtermin, value: string) {
    setWunschtermine(wunschtermine.map((t, i) => i === idx ? { ...t, [field]: value } : t))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const filledTermine = wunschtermine.filter(t => t.datum)
    if (filledTermine.length === 0) {
      setError('Bitte gib mindestens einen Wunschtermin an.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/makler-anfragen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thema,
          beschreibung,
          telefon,
          wunschtermine: filledTermine,
          listing_id: listingId ?? undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Fehler beim Senden')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Netzwerkfehler. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-[#E8F5EE] border border-[#1B6B45]/30 rounded-xl p-8 flex flex-col items-center text-center">
        <CheckCircle2 size={40} className="text-[#1B6B45] mb-4" strokeWidth={1.5} />
        <p className="text-[17px] font-bold text-text-primary mb-2">Anfrage gesendet!</p>
        <p className="text-[14px] text-text-secondary">
          Du erhältst eine Bestätigungsmail. Wir melden uns innerhalb von 24 Stunden.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#EEEEEE] p-6 space-y-5">
      <h2 className="text-[17px] font-bold text-text-primary" style={{ letterSpacing: '-0.18px' }}>
        Anfrage stellen
      </h2>

      {error && (
        <p className="text-[13px] text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
      )}

      {/* Thema */}
      <div>
        <label className="block text-[13px] font-semibold text-text-primary mb-1.5">Thema *</label>
        <select
          required
          value={thema}
          onChange={(e) => setThema(e.target.value)}
          className={`${inputBase} appearance-none cursor-pointer`}
        >
          <option value="">Bitte wählen …</option>
          {THEMEN.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Beschreibung */}
      <div>
        <label className="block text-[13px] font-semibold text-text-primary mb-1.5">
          Dein Anliegen *
          <span className="text-text-tertiary font-normal ml-2">{beschreibung.length}/1000</span>
        </label>
        <textarea
          required
          rows={4}
          maxLength={1000}
          value={beschreibung}
          onChange={(e) => setBeschreibung(e.target.value)}
          placeholder="Beschreibe kurz, wobei du Unterstützung benötigst …"
          className="w-full rounded-[8px] border border-[#DDDDDD] px-4 py-3 text-[14px] text-text-primary bg-white focus:outline-none focus:border-[#1B6B45] transition-colors resize-none"
        />
      </div>

      {/* Wunschtermine */}
      <div>
        <label className="block text-[13px] font-semibold text-text-primary mb-1.5">
          Wunschtermine * <span className="text-text-tertiary font-normal">(max. 3)</span>
        </label>
        <div className="space-y-3">
          {wunschtermine.map((t, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="date"
                    min={getTodayStr()}
                    value={t.datum}
                    onChange={(e) => updateSlot(i, 'datum', e.target.value)}
                    className={`${inputBase} cursor-pointer`}
                  />
                  {t.datum && isWeekday(t.datum) && (
                    <p className="text-[12px] text-[#C07000] mt-1">
                      Werktag: bevorzugt &quot;Abends&quot; wählen
                    </p>
                  )}
                </div>
                <select
                  value={t.tageszeit}
                  onChange={(e) => updateSlot(i, 'tageszeit', e.target.value)}
                  className={`${inputBase} appearance-none cursor-pointer`}
                >
                  {TAGESZEITEN.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
              {wunschtermine.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="mt-3 p-1.5 rounded-lg hover:bg-[#F5F5F5] text-text-tertiary hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        {wunschtermine.length < 3 && (
          <button
            type="button"
            onClick={addSlot}
            className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-[#1B6B45] hover:underline"
          >
            <Plus size={14} />
            Weiteren Termin hinzufügen
          </button>
        )}
      </div>

      {/* Telefon */}
      <div>
        <label className="block text-[13px] font-semibold text-text-primary mb-1.5">Telefonnummer *</label>
        <input
          type="tel"
          required
          value={telefon}
          onChange={(e) => setTelefon(e.target.value)}
          placeholder="+49 151 12345678"
          className={inputBase}
        />
        <p className="text-[12px] text-text-tertiary mt-1">Du wirst unter dieser Nummer angerufen.</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-pill bg-[#1B6B45] hover:bg-[#15563A] text-white text-[14px] font-semibold h-11 transition-colors duration-150 disabled:opacity-60"
      >
        {loading ? 'Wird gesendet…' : 'Anfrage absenden'}
      </button>
    </form>
  )
}
