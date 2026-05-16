'use client'

import { useState, useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import { saveInteressent } from './actions'

interface Props {
  interessent: Record<string, unknown>
}

const inputBase =
  'w-full rounded-[8px] border border-[#DDDDDD] px-3 min-h-[40px] text-[13px] text-text-primary bg-white outline-none transition-all focus:ring-2 focus:ring-accent focus:border-transparent placeholder:text-text-tertiary'
const selectBase = `${inputBase} appearance-none cursor-pointer pr-8`
const labelBase = 'block text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-1'

const STATUS_OPTIONS = [
  { value: 'neu', label: 'Neu' },
  { value: 'vorqualifiziert', label: 'Vorqualifiziert' },
  { value: 'besichtigung_geplant', label: 'Besichtigung geplant' },
  { value: 'besichtigt', label: 'Besichtigt' },
  { value: 'angebot_abgegeben', label: 'Angebot abgegeben' },
  { value: 'verhandlung', label: 'Verhandlung' },
  { value: 'zugesagt', label: 'Zugesagt' },
  { value: 'abgesagt', label: 'Abgesagt' },
]

const BONITAET_OPTIONS = [
  { value: '', label: '— Nicht bewertet —' },
  { value: 'bestaetigt', label: '✓ Bestätigt' },
  { value: 'unklar', label: '⚠ Unklar' },
  { value: 'kritisch', label: '✗ Kritisch' },
]

const ALTERSGRUPPE_OPTIONS = [
  { value: '20-30', label: '20 – 30 Jahre' },
  { value: '30-40', label: '30 – 40 Jahre' },
  { value: '40-50', label: '40 – 50 Jahre' },
  { value: '50-60', label: '50 – 60 Jahre' },
  { value: '60+', label: 'Über 60 Jahre' },
]

const WOHNSITUATION_OPTIONS = [
  { value: 'miete', label: 'Miete' },
  { value: 'eigentum', label: 'Eigentum' },
  { value: 'bei_eltern', label: 'Bei Eltern' },
  { value: 'sonstiges', label: 'Sonstiges' },
]

const FINANZIERUNG_OPTIONS = [
  { value: 'eigenkapital_vorhanden', label: 'Eigenkapital vorhanden' },
  { value: 'bank_vorpruefung', label: 'Bank-Vorprüfung läuft' },
  { value: 'finanzierung_laeuft', label: 'Finanzierung bewilligt' },
  { value: 'barzahler', label: 'Barzahler' },
  { value: 'nicht_geklaert', label: 'Noch nicht geklärt' },
]

const ZEITHORIZONT_OPTIONS = [
  { value: 'sofort', label: 'Sofort' },
  { value: '1-3_monate', label: '1–3 Monate' },
  { value: '3-6_monate', label: '3–6 Monate' },
  { value: '6+_monate', label: 'Mehr als 6 Monate' },
  { value: 'flexibel', label: 'Flexibel' },
]

function SelectInput({
  name, value, options, placeholder,
}: {
  name: string
  value: string
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  return (
    <div className="relative">
      <select name={name} defaultValue={value} className={selectBase}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
    </div>
  )
}

export default function TabDaten({ interessent }: Props) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<'ok' | string | null>(null)
  const [bonitaet, setBonitaet] = useState((interessent.bonitaet as string) ?? '')
  const [resetKey, setResetKey] = useState(0)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await saveInteressent(interessent.id as string, {
        name: (fd.get('name') as string) ?? '',
        email: (fd.get('email') as string) || undefined,
        telefon: (fd.get('telefon') as string) || undefined,
        status: (fd.get('status') as string) || undefined,
        bonitaet: (fd.get('bonitaet') as string) || undefined,
        bonitaet_notiz: (fd.get('bonitaet_notiz') as string) || undefined,
        abgegebenes_angebot: (fd.get('abgegebenes_angebot') as string) || undefined,
        altersgruppe: (fd.get('altersgruppe') as string) || undefined,
        beruf: (fd.get('beruf') as string) || undefined,
        wohnsituation_aktuell: (fd.get('wohnsituation_aktuell') as string) || undefined,
        finanzierung_status: (fd.get('finanzierung_status') as string) || undefined,
        zeithorizont: (fd.get('zeithorizont') as string) || undefined,
      })
      if ('success' in result && result.success) {
        setFeedback('ok')
        setTimeout(() => setFeedback(null), 2000)
      } else {
        setFeedback(('error' in result ? result.error : null) ?? 'Fehler beim Speichern')
      }
    })
  }

  function handleAbbrechen() {
    setBonitaet((interessent.bonitaet as string) ?? '')
    setResetKey(k => k + 1)
    setFeedback(null)
  }

  return (
    <form key={resetKey} onSubmit={handleSubmit} className="space-y-4">
      {feedback === 'ok' && (
        <p className="text-[13px] font-medium text-[#1B6B45] bg-[#E8F5EE] px-3 py-2 rounded-lg">
          Gespeichert.
        </p>
      )}
      {feedback && feedback !== 'ok' && (
        <p className="text-[13px] text-[#C13515] bg-[#FDECEA] px-3 py-2 rounded-lg">{feedback}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelBase}>Name *</label>
          <input name="name" type="text" defaultValue={interessent.name as string} required className={inputBase} />
        </div>
        <div>
          <label className={labelBase}>E-Mail</label>
          <input name="email" type="email" defaultValue={(interessent.email as string) ?? ''} className={inputBase} />
        </div>
        <div>
          <label className={labelBase}>Telefon</label>
          <input name="telefon" type="tel" defaultValue={(interessent.telefon as string) ?? ''} className={inputBase} />
        </div>
        <div>
          <label className={labelBase}>Status</label>
          <SelectInput name="status" value={(interessent.status as string) ?? 'neu'} options={STATUS_OPTIONS} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelBase}>Bonität</label>
          <div className="relative">
            <select
              name="bonitaet"
              value={bonitaet}
              onChange={e => setBonitaet(e.target.value)}
              className={selectBase}
            >
              {BONITAET_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
          </div>
        </div>
        {bonitaet && (
          <div>
            <label className={labelBase}>Notiz Bonität</label>
            <input
              name="bonitaet_notiz"
              type="text"
              defaultValue={(interessent.bonitaet_notiz as string) ?? ''}
              placeholder="Kurze Einschätzung…"
              className={inputBase}
            />
          </div>
        )}
      </div>

      <div>
        <label className={labelBase}>Aktuelles Angebot</label>
        <div className="relative">
          <input
            name="abgegebenes_angebot"
            type="number"
            step="1"
            min="0"
            defaultValue={(interessent.abgegebenes_angebot as number) ?? ''}
            placeholder="0"
            className={`${inputBase} pr-8`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-[13px] pointer-events-none">
            €
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelBase}>Altersgruppe</label>
          <SelectInput
            name="altersgruppe"
            value={(interessent.altersgruppe as string) ?? ''}
            options={ALTERSGRUPPE_OPTIONS}
            placeholder="— Bitte wählen —"
          />
        </div>
        <div>
          <label className={labelBase}>Beruf / Branche</label>
          <input
            name="beruf"
            type="text"
            defaultValue={(interessent.beruf as string) ?? ''}
            placeholder="z. B. Ingenieur"
            className={inputBase}
          />
        </div>
        <div>
          <label className={labelBase}>Wohnsituation</label>
          <SelectInput
            name="wohnsituation_aktuell"
            value={(interessent.wohnsituation_aktuell as string) ?? ''}
            options={WOHNSITUATION_OPTIONS}
            placeholder="— Bitte wählen —"
          />
        </div>
        <div>
          <label className={labelBase}>Finanzierungsstatus</label>
          <SelectInput
            name="finanzierung_status"
            value={(interessent.finanzierung_status as string) ?? ''}
            options={FINANZIERUNG_OPTIONS}
            placeholder="— Bitte wählen —"
          />
        </div>
        <div>
          <label className={labelBase}>Zeithorizont</label>
          <SelectInput
            name="zeithorizont"
            value={(interessent.zeithorizont as string) ?? ''}
            options={ZEITHORIZONT_OPTIONS}
            placeholder="— Bitte wählen —"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={handleAbbrechen}
          className="px-4 py-2 rounded-[8px] border border-[#DDDDDD] text-[13px] font-medium text-text-primary hover:bg-gray-50 transition-colors"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#1B6B45] text-white text-[13px] font-semibold hover:bg-[#145538] disabled:opacity-60 transition-colors"
        >
          {isPending ? '…' : '💾 Speichern'}
        </button>
      </div>
    </form>
  )
}
