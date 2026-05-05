'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, RefreshCw, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import InlineButton from '@/components/klara/InlineButton'

// ─── Types ────────────────────────────────────────────────────────────────────

type Modus = 'schnell' | 'standard' | 'exakt'
type Phase = 'modus' | 'fragen' | 'zusammenfassung' | 'laden' | 'ergebnis'
type Answers = Record<string, string | string[] | number | null>

interface PriceResult {
  min: number
  max: number
  mittelwert: number
  positive_faktoren: string[]
  negative_faktoren: string[]
  hinweis: string
}

interface QuestionConfig {
  id: string
  label: string
  sublabel?: string
  type: 'select' | 'number' | 'plz-ort' | 'radio' | 'multiselect' | 'slider' | 'number-checkbox' | 'foto-info'
  options?: string[]
  step?: number
  min?: number
  max?: number
  optional?: boolean
  gruppe: 'A' | 'B' | 'C'
  showIf?: (answers: Answers) => boolean
}

interface ListingData {
  id: string
  objekttyp?: string | null
  adresse_plz?: string | null
  adresse_ort?: string | null
  wohnflaeche_qm?: number | null
  zimmer?: number | null
  baujahr?: number | null
  zustand?: string | null
  energieausweis_klasse?: string | null
  grundstueck_qm?: number | null
  etage?: number | null
  fotos?: unknown[] | null
}

interface LetzteBerechnung {
  modus: string
  ergebnis: PriceResult
  created_at: string
}

// ─── Konstanten ───────────────────────────────────────────────────────────────

const HAUS_TYPEN = ['Einfamilienhaus', 'Doppelhaushälfte', 'Reihenhaus', 'Mehrfamilienhaus']

const QUESTIONS: QuestionConfig[] = [
  // Gruppe A
  {
    id: 'A1', gruppe: 'A', label: 'Um welchen Objekttyp handelt es sich?',
    type: 'select',
    options: ['Einfamilienhaus', 'Doppelhaushälfte', 'Reihenhaus', 'Wohnung', 'Mehrfamilienhaus', 'Grundstück'],
  },
  {
    id: 'A2', gruppe: 'A', label: 'Wo befindet sich die Immobilie?',
    type: 'plz-ort',
  },
  {
    id: 'A3', gruppe: 'A', label: 'Wie groß ist die Wohnfläche?',
    sublabel: 'in Quadratmetern', type: 'number', min: 10, max: 2000,
  },
  {
    id: 'A4', gruppe: 'A', label: 'Wie viele Zimmer hat die Immobilie?',
    sublabel: 'Wohnzimmer, Schlafzimmer etc. (ohne Küche, Bad)',
    type: 'number', min: 1, max: 20, step: 0.5,
  },
  {
    id: 'A5', gruppe: 'A', label: 'In welchem Jahr wurde die Immobilie gebaut?',
    type: 'number', min: 1800, max: new Date().getFullYear(),
  },
  // Gruppe B
  {
    id: 'B1', gruppe: 'B', label: 'Wie groß ist das Grundstück?',
    sublabel: 'in Quadratmetern', type: 'number', min: 0, max: 50000, optional: true,
    showIf: (a) => HAUS_TYPEN.includes(String(a.A1 ?? '')),
  },
  {
    id: 'B2', gruppe: 'B', label: 'In welcher Etage liegt die Wohnung?',
    sublabel: 'Erdgeschoss = 0', type: 'number-checkbox',
    options: ['Aufzug vorhanden'], optional: true,
    showIf: (a) => a.A1 === 'Wohnung',
  },
  {
    id: 'B3', gruppe: 'B', label: 'Wie ist der allgemeine Zustand der Immobilie?',
    type: 'slider', min: 1, max: 5,
    options: ['Starker Renovierungsbedarf', 'Renovierungsbedarf', 'Gepflegt', 'Gut erhalten', 'Neuwertig'],
  },
  {
    id: 'B4', gruppe: 'B', label: 'Welche Heizungsart ist vorhanden?',
    type: 'select', optional: true,
    options: ['Gas', 'Öl', 'Fernwärme', 'Wärmepumpe', 'Pellet', 'Sonstiges', 'Unbekannt'],
  },
  {
    id: 'B5', gruppe: 'B', label: 'Welche Energieausweis-Klasse hat die Immobilie?',
    type: 'select', optional: true,
    options: ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'Noch nicht vorhanden'],
  },
  {
    id: 'B6', gruppe: 'B', label: 'Gibt es einen Stellplatz oder eine Garage?',
    type: 'select', optional: true,
    options: ['Kein', 'Außenstellplatz', 'Tiefgarage', 'Einzelgarage', 'Doppelgarage'],
  },
  {
    id: 'B7', gruppe: 'B', label: 'Gab es in den letzten 10 Jahren größere Renovierungen?',
    type: 'radio', options: ['Ja', 'Nein'],
  },
  // Gruppe C
  {
    id: 'C1', gruppe: 'C', label: 'Was wurde renoviert?',
    type: 'multiselect', optional: true,
    options: ['Küche', 'Bad', 'Fenster', 'Dach', 'Heizung', 'Fassade', 'Boden', 'Elektrik'],
    showIf: (a) => a.B7 === 'Ja',
  },
  {
    id: 'C2', gruppe: 'C', label: 'Was muss noch gemacht werden?',
    type: 'multiselect', optional: true,
    options: ['Küche', 'Bad', 'Fenster', 'Dach', 'Heizung', 'Fassade', 'Boden', 'Elektrik'],
  },
  {
    id: 'C3', gruppe: 'C', label: 'Ist ein Keller vorhanden?',
    type: 'select', optional: true,
    options: ['Nein', 'Ja, nicht ausgebaut', 'Ja, ausgebaut'],
  },
  {
    id: 'C4', gruppe: 'C', label: 'Welche Außenbereiche gibt es?',
    type: 'multiselect', optional: true,
    options: ['Balkon', 'Terrasse', 'Garten', 'Loggia', 'Dachterrasse'],
  },
  {
    id: 'C5', gruppe: 'C', label: 'Wie schätzen Sie die Wohnlage ein?',
    type: 'select',
    options: ['Sehr gute Lage', 'Gute Lage', 'Mittlere Lage', 'Einfache Lage'],
  },
  {
    id: 'C6', gruppe: 'C', label: 'Ist die Immobilie vermietet?',
    type: 'number-checkbox', optional: true,
    sublabel: 'Monatliche Mieteinnahmen (€)',
    options: ['Ja, vermietet'],
  },
  {
    id: 'C7', gruppe: 'C', label: 'Wie haben Sie die Immobilie erworben?',
    type: 'select', optional: true,
    options: ['Kauf', 'Erbschaft', 'Schenkung', 'Sonstiges'],
  },
  {
    id: 'C8', gruppe: 'C', label: 'In welchem Jahr wurde die Immobilie erworben?',
    type: 'number', min: 1900, max: new Date().getFullYear(), optional: true,
    showIf: (a) => Boolean(a.C7),
  },
  {
    id: 'C9', gruppe: 'C', label: 'Liegt eine Grundschuld vor?',
    type: 'radio', optional: true,
    options: ['Ja', 'Nein', 'Weiß nicht'],
  },
  {
    id: 'C10', gruppe: 'C', label: 'Fotos der Immobilie',
    type: 'foto-info', optional: true,
  },
]

const MODUS_INFO: Record<Modus, { label: string; fragen: number; dauer: string; genauigkeit: string; beschreibung: string }> = {
  schnell: { label: 'Sofort-Schätzung', fragen: 5, dauer: '~1 Min', genauigkeit: 'Grobe Orientierung (±20%)', beschreibung: 'Schnelle Einschätzung auf Basis der wichtigsten Kerndaten.' },
  standard: { label: 'Markteinschätzung', fragen: 12, dauer: '~4 Min', genauigkeit: 'Fundierter Richtwert (±10%)', beschreibung: 'Detailliertere Analyse unter Einbezug von Zustand, Energieeffizienz und Ausstattung.' },
  exakt: { label: 'Vollanalyse', fragen: 22, dauer: '~8–10 Min', genauigkeit: 'Detaillierte Einschätzung (±5%)', beschreibung: 'Umfassende Bewertung aller wertrelevanten Faktoren für eine präzise Einschätzung.' },
}

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

function zustandToSlider(zustand: string | null | undefined): number | null {
  const map: Record<string, number> = { schlecht: 1, renovierungsbedarf: 2, mittel: 3, gut: 4, neuwertig: 5 }
  if (!zustand) return null
  return map[zustand.toLowerCase()] ?? null
}

function formatEuro(n: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function getQuestionsForModus(modus: Modus, answers: Answers): QuestionConfig[] {
  const gruppenFuerModus: Record<Modus, string[]> = { schnell: ['A'], standard: ['A', 'B'], exakt: ['A', 'B', 'C'] }
  const gruppen = gruppenFuerModus[modus]
  return QUESTIONS
    .filter(q => gruppen.includes(q.gruppe))
    .filter(q => !q.showIf || q.showIf(answers))
}

function isPrefilledFromListing(id: string, listing: ListingData | null): boolean {
  if (!listing) return false
  const map: Record<string, unknown> = {
    A1: listing.objekttyp,
    A3: listing.wohnflaeche_qm,
    A4: listing.zimmer,
    A5: listing.baujahr,
    B1: listing.grundstueck_qm,
    B2: listing.etage,
    B3: zustandToSlider(listing.zustand),
    B5: listing.energieausweis_klasse,
  }
  const val = map[id]
  if (id === 'A2') return Boolean(listing.adresse_plz || listing.adresse_ort)
  return val !== null && val !== undefined
}

function getAnswerLabel(q: QuestionConfig, answers: Answers): string {
  if (q.type === 'plz-ort') {
    const plz = answers['A2_plz'] ?? ''
    const ort = answers['A2_ort'] ?? ''
    return [plz, ort].filter(Boolean).join(' ') || '—'
  }
  if (q.type === 'slider') {
    const val = Number(answers[q.id])
    return q.options?.[val - 1] ?? String(val)
  }
  if (q.type === 'multiselect') {
    const val = answers[q.id]
    if (Array.isArray(val)) return val.join(', ') || '—'
    return String(val ?? '—')
  }
  if (q.type === 'number-checkbox') {
    if (q.id === 'B2') {
      const etage = answers['B2_etage']
      const aufzug = answers['B2_aufzug']
      if (etage === null || etage === undefined || etage === '') return '—'
      return `Etage ${etage}${aufzug === 'true' ? ', Aufzug' : ''}`
    }
    if (q.id === 'C6') {
      const vermietet = answers['C6_vermietet']
      const miete = answers['C6_miete']
      if (!vermietet || vermietet === 'false') return 'Nein'
      return miete ? `Ja, ${miete} €/Monat` : 'Ja'
    }
  }
  const val = answers[q.id]
  if (val === null || val === undefined || val === '') return '—'
  if (q.type === 'number') {
    const unit = q.id === 'A3' ? ' m²' : q.id === 'B1' ? ' m²' : ''
    return `${val}${unit}`
  }
  return String(val)
}

// ─── Fragen-Renderer ──────────────────────────────────────────────────────────

function QuestionRenderer({
  question, answers, onChange, prefilled,
}: {
  question: QuestionConfig
  answers: Answers
  onChange: (updates: Partial<Answers>) => void
  prefilled: boolean
}) {
  const val = answers[question.id]

  if (question.type === 'select') {
    return (
      <div className="flex flex-wrap gap-2">
        {question.options!.map(opt => (
          <button
            key={opt}
            onClick={() => onChange({ [question.id]: opt })}
            className={`px-4 py-2.5 rounded-full text-[14px] font-medium border transition-all ${
              val === opt
                ? 'bg-[#1B6B45] text-white border-[#1B6B45]'
                : 'bg-white text-text-primary border-[#DDDDDD] hover:border-[#1B6B45] hover:text-[#1B6B45]'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    )
  }

  if (question.type === 'radio') {
    return (
      <div className="flex gap-3 flex-wrap">
        {question.options!.map(opt => (
          <button
            key={opt}
            onClick={() => onChange({ [question.id]: opt })}
            className={`px-6 py-3 rounded-xl text-[14px] font-medium border-2 transition-all min-w-[100px] ${
              val === opt
                ? 'bg-[#E8F5EE] text-[#1B6B45] border-[#1B6B45]'
                : 'bg-white text-text-primary border-[#DDDDDD] hover:border-[#1B6B45]'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    )
  }

  if (question.type === 'multiselect') {
    const selected: string[] = Array.isArray(val) ? (val as string[]) : []
    return (
      <div className="flex flex-wrap gap-2">
        {question.options!.map(opt => {
          const active = selected.includes(opt)
          return (
            <button
              key={opt}
              onClick={() => {
                const next = active ? selected.filter(s => s !== opt) : [...selected, opt]
                onChange({ [question.id]: next })
              }}
              className={`px-4 py-2.5 rounded-full text-[14px] font-medium border transition-all ${
                active
                  ? 'bg-[#1B6B45] text-white border-[#1B6B45]'
                  : 'bg-white text-text-primary border-[#DDDDDD] hover:border-[#1B6B45] hover:text-[#1B6B45]'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    )
  }

  if (question.type === 'number') {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            const cur = Number(val ?? question.min ?? 0)
            const step = question.step ?? 1
            const next = Math.max(question.min ?? 0, cur - step)
            onChange({ [question.id]: next })
          }}
          className="w-11 h-11 rounded-full border border-[#DDDDDD] bg-white text-text-primary text-lg font-bold hover:border-[#1B6B45] hover:text-[#1B6B45] transition-colors flex items-center justify-center"
        >
          −
        </button>
        <input
          type="number"
          value={val ?? ''}
          step={question.step ?? 1}
          min={question.min}
          max={question.max}
          onChange={e => onChange({ [question.id]: e.target.value === '' ? null : Number(e.target.value) })}
          className="w-32 text-center text-[18px] font-semibold border border-[#DDDDDD] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#1B6B45]"
        />
        <button
          onClick={() => {
            const cur = Number(val ?? (question.min ?? 0) - (question.step ?? 1))
            const step = question.step ?? 1
            const next = Math.min(question.max ?? 99999, cur + step)
            onChange({ [question.id]: next })
          }}
          className="w-11 h-11 rounded-full border border-[#DDDDDD] bg-white text-text-primary text-lg font-bold hover:border-[#1B6B45] hover:text-[#1B6B45] transition-colors flex items-center justify-center"
        >
          +
        </button>
        {question.sublabel && (
          <span className="text-[13px] text-text-secondary">{question.sublabel}</span>
        )}
      </div>
    )
  }

  if (question.type === 'plz-ort') {
    return (
      <div className="flex gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-text-secondary font-medium">PLZ</label>
          <input
            type="text"
            maxLength={5}
            value={(answers['A2_plz'] as string) ?? ''}
            onChange={e => onChange({ A2_plz: e.target.value })}
            placeholder="z.B. 80331"
            className="w-28 border border-[#DDDDDD] rounded-xl px-3 py-2.5 text-[15px] focus:outline-none focus:border-[#1B6B45]"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-[12px] text-text-secondary font-medium">Ort</label>
          <input
            type="text"
            value={(answers['A2_ort'] as string) ?? ''}
            onChange={e => onChange({ A2_ort: e.target.value })}
            placeholder="z.B. München"
            className="w-full border border-[#DDDDDD] rounded-xl px-3 py-2.5 text-[15px] focus:outline-none focus:border-[#1B6B45]"
          />
        </div>
      </div>
    )
  }

  if (question.type === 'slider') {
    const sliderVal = Number(val ?? 3)
    return (
      <div className="space-y-4">
        <input
          type="range"
          min={question.min ?? 1}
          max={question.max ?? 5}
          step={1}
          value={sliderVal}
          onChange={e => onChange({ [question.id]: Number(e.target.value) })}
          className="w-full accent-[#1B6B45]"
        />
        <div className="flex justify-between text-[12px] text-text-secondary">
          {question.options!.map((label, i) => (
            <span
              key={i}
              className={`text-center w-1/5 leading-tight ${
                sliderVal === i + 1 ? 'text-[#1B6B45] font-semibold' : ''
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (question.type === 'number-checkbox') {
    if (question.id === 'B2') {
      const etageVal = answers['B2_etage']
      const aufzugVal = answers['B2_aufzug'] === 'true'
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onChange({ B2_etage: Math.max(0, Number(etageVal ?? 0) - 1) })}
              className="w-11 h-11 rounded-full border border-[#DDDDDD] bg-white text-lg font-bold hover:border-[#1B6B45] hover:text-[#1B6B45] transition-colors flex items-center justify-center"
            >
              −
            </button>
            <input
              type="number"
              value={etageVal ?? ''}
              min={0}
              max={50}
              onChange={e => onChange({ B2_etage: e.target.value === '' ? null : Number(e.target.value) })}
              className="w-24 text-center text-[18px] font-semibold border border-[#DDDDDD] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#1B6B45]"
            />
            <button
              onClick={() => onChange({ B2_etage: Number(etageVal ?? -1) + 1 })}
              className="w-11 h-11 rounded-full border border-[#DDDDDD] bg-white text-lg font-bold hover:border-[#1B6B45] hover:text-[#1B6B45] transition-colors flex items-center justify-center"
            >
              +
            </button>
            <span className="text-[13px] text-text-secondary">Etage (0 = EG)</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={aufzugVal}
              onChange={e => onChange({ B2_aufzug: String(e.target.checked) })}
              className="accent-[#1B6B45] w-4 h-4"
            />
            <span className="text-[14px] text-text-primary">Aufzug vorhanden</span>
          </label>
        </div>
      )
    }
    if (question.id === 'C6') {
      const vermietetVal = answers['C6_vermietet'] === 'true'
      const mieteVal = answers['C6_miete']
      return (
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={vermietetVal}
              onChange={e => onChange({ C6_vermietet: String(e.target.checked) })}
              className="accent-[#1B6B45] w-4 h-4"
            />
            <span className="text-[14px] text-text-primary">Ja, die Immobilie ist vermietet</span>
          </label>
          {vermietetVal && (
            <div className="flex items-center gap-3 mt-2">
              <input
                type="number"
                value={mieteVal ?? ''}
                min={0}
                placeholder="z.B. 1200"
                onChange={e => onChange({ C6_miete: e.target.value === '' ? null : Number(e.target.value) })}
                className="w-36 border border-[#DDDDDD] rounded-xl px-3 py-2.5 text-[15px] focus:outline-none focus:border-[#1B6B45]"
              />
              <span className="text-[13px] text-text-secondary">€ / Monat</span>
            </div>
          )}
        </div>
      )
    }
  }

  if (question.type === 'foto-info') {
    return (
      <p className="text-[14px] text-text-secondary">
        Fotos aus deinem Inserat werden automatisch für die Analyse berücksichtigt.
      </p>
    )
  }

  return null
}

// ─── Ladescreen-Texte ─────────────────────────────────────────────────────────

const LADE_TEXTE = [
  'Wir analysieren deine Immobilie…',
  'Preisdaten werden ausgewertet…',
  'Marktlage wird berücksichtigt…',
  'Fast fertig…',
]

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export default function PreisrechnerClient({
  listing,
  userId: _userId,
  letzteBerechnung,
}: {
  listing: ListingData | null
  userId: string
  letzteBerechnung: LetzteBerechnung | null
}) {
  const initialAnswers = useMemo<Answers>(() => ({
    A1: listing?.objekttyp ?? null,
    A2_plz: listing?.adresse_plz ?? null,
    A2_ort: listing?.adresse_ort ?? null,
    A3: listing?.wohnflaeche_qm ?? null,
    A4: listing?.zimmer ?? null,
    A5: listing?.baujahr ?? null,
    B1: listing?.grundstueck_qm ?? null,
    B2_etage: listing?.etage ?? null,
    B3: zustandToSlider(listing?.zustand) ?? 3,
    B5: listing?.energieausweis_klasse ?? null,
  }), [listing])

  const [phase, setPhase] = useState<Phase>('modus')
  const [modus, setModus] = useState<Modus | null>(null)
  const [answers, setAnswers] = useState<Answers>(initialAnswers)
  const [stepIndex, setStepIndex] = useState(0)
  const [result, setResult] = useState<PriceResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ladeText, setLadeText] = useState(LADE_TEXTE[0])

  const activeQuestions = useMemo(
    () => modus ? getQuestionsForModus(modus, answers) : [],
    [modus, answers],
  )

  const currentQuestion = activeQuestions[stepIndex]
  const totalSteps = activeQuestions.length
  const progressPct = totalSteps > 0 ? ((stepIndex + 1) / totalSteps) * 100 : 0

  const zeigeSteuerwarnungC8 = useMemo(() => {
    if (!answers.C7 || !answers.C8) return false
    const haltedauer = new Date().getFullYear() - Number(answers.C8)
    return haltedauer < 10
  }, [answers.C7, answers.C8])

  // Rotate loading text
  useEffect(() => {
    if (phase !== 'laden') return
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % LADE_TEXTE.length
      setLadeText(LADE_TEXTE[i])
    }, 2200)
    return () => clearInterval(interval)
  }, [phase])

  const startModus = useCallback((m: Modus) => {
    setModus(m)
    setAnswers(initialAnswers)
    setStepIndex(0)
    setPhase('fragen')
    setResult(null)
    setError(null)
  }, [initialAnswers])

  const handleChange = useCallback((updates: Partial<Answers>) => {
    setAnswers(prev => ({ ...prev, ...updates } as Answers))
  }, [])

  const canAdvance = (): boolean => {
    if (!currentQuestion) return false
    if (currentQuestion.optional) return true
    const { type, id } = currentQuestion
    if (type === 'plz-ort') return Boolean(answers['A2_plz'] && answers['A2_ort'])
    if (type === 'slider') return true
    if (type === 'number-checkbox') {
      if (id === 'B2') return answers['B2_etage'] !== null && answers['B2_etage'] !== undefined
      return true
    }
    return answers[id] !== null && answers[id] !== undefined && answers[id] !== ''
  }

  const handleWeiter = () => {
    if (stepIndex < totalSteps - 1) {
      setStepIndex(i => i + 1)
    } else {
      setPhase('zusammenfassung')
    }
  }

  const handleZurueck = () => {
    if (stepIndex > 0) {
      setStepIndex(i => i - 1)
    } else {
      setPhase('modus')
    }
  }

  const handleBerechnen = async () => {
    setPhase('laden')
    setError(null)
    setLadeText(LADE_TEXTE[0])
    try {
      const eingaben: Answers = { ...answers, modus }
      const res = await fetch('/api/preisrechner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modus, eingaben, listingId: listing?.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Fehler bei der Berechnung')
      setResult(data)
      setPhase('ergebnis')
    } catch (e) {
      setError(String(e))
      setPhase('zusammenfassung')
    }
  }

  const jumpToGruppe = (gruppe: 'A' | 'B' | 'C') => {
    const firstIdx = activeQuestions.findIndex(q => q.gruppe === gruppe)
    if (firstIdx >= 0) {
      setStepIndex(firstIdx)
      setPhase('fragen')
    }
  }

  // ─── Phase: Modus-Auswahl ────────────────────────────────────────────────────
  if (phase === 'modus') {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {(['schnell', 'standard', 'exakt'] as Modus[]).map(m => {
            const info = MODUS_INFO[m]
            return (
              <button
                key={m}
                onClick={() => startModus(m)}
                className="bg-white border border-[#DDDDDD] rounded-xl p-6 text-left hover:border-[#1B6B45] hover:shadow-md transition-all group flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[17px] font-bold text-text-primary">{info.label}</span>
                  <ArrowRight size={16} className="text-text-tertiary group-hover:text-[#1B6B45] mt-0.5 transition-colors" />
                </div>
                <p className="text-[13px] text-text-secondary leading-relaxed">{info.beschreibung}</p>
                <div className="mt-auto pt-2 border-t border-[#EEEEEE] flex flex-col gap-1">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-text-tertiary">Fragen</span>
                    <span className="font-medium text-text-primary">{info.fragen}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-text-tertiary">Dauer</span>
                    <span className="font-medium text-text-primary">{info.dauer}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-text-tertiary">Genauigkeit</span>
                    <span className="font-medium text-text-primary">{info.genauigkeit}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {letzteBerechnung && (
          <div className="bg-white border border-[#DDDDDD] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wide mb-1">
                Letzte Berechnung · {new Date(letzteBerechnung.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} · {MODUS_INFO[letzteBerechnung.modus as Modus]?.label ?? letzteBerechnung.modus}
              </p>
              <p className="text-[22px] font-bold text-text-primary" style={{ letterSpacing: '-0.18px' }}>
                {formatEuro(letzteBerechnung.ergebnis.min)} – {formatEuro(letzteBerechnung.ergebnis.max)}
              </p>
              <p className="text-[13px] text-text-secondary mt-0.5">
                Mittelwert: ca. {formatEuro(letzteBerechnung.ergebnis.mittelwert)}
              </p>
            </div>
            <button
              onClick={() => { setResult(letzteBerechnung.ergebnis); setModus(letzteBerechnung.modus as Modus); setPhase('ergebnis') }}
              className="shrink-0 flex items-center gap-2 border border-[#DDDDDD] text-text-primary text-[13px] font-medium px-4 py-2 rounded-full hover:border-[#1B6B45] hover:text-[#1B6B45] transition-colors"
            >
              Details anzeigen
              <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>
    )
  }

  // ─── Phase: Fragen ───────────────────────────────────────────────────────────
  if (phase === 'fragen' && currentQuestion) {
    const prefilled = isPrefilledFromListing(currentQuestion.id, listing)
    return (
      <div className="space-y-6">
        {/* Fortschrittsbalken */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[12px] text-text-secondary">
            <span>Schritt {stepIndex + 1} von {totalSteps}</span>
            <span className="capitalize">{modus ? MODUS_INFO[modus].label : ''}</span>
          </div>
          <div className="h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1B6B45] rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Frage-Card */}
        <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 space-y-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-bold text-text-primary leading-snug">
                {currentQuestion.label}
              </h2>
              {currentQuestion.optional && (
                <span className="text-[11px] text-text-tertiary border border-[#DDDDDD] rounded-full px-2 py-0.5">Optional</span>
              )}
            </div>
            {currentQuestion.sublabel && (
              <p className="text-[13px] text-text-secondary">{currentQuestion.sublabel}</p>
            )}
            {prefilled && (
              <p className="text-[11px] text-[#1B6B45] font-medium">Aus deinem Inserat übernommen</p>
            )}
          </div>

          <QuestionRenderer
            question={currentQuestion}
            answers={answers}
            onChange={handleChange}
            prefilled={prefilled}
          />

          {/* Spekulationssteuer-Hinweis */}
          {currentQuestion.id === 'C8' && zeigeSteuerwarnungC8 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-[13px] text-amber-800 leading-relaxed">
              <strong>⚠️ Hinweis:</strong> Bei Immobilien, die weniger als 10 Jahre gehalten werden, kann beim Verkauf Spekulationssteuer anfallen. Dies gilt nicht für selbst genutzte Immobilien. Bitte klären Sie dies mit einem Steuerberater oder Finanzamt. Wir geben keinen Steuerrat.
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleZurueck}
            className="flex items-center gap-1.5 text-[14px] text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={16} />
            Zurück
          </button>
          <button
            onClick={handleWeiter}
            disabled={!canAdvance()}
            className="flex items-center gap-2 bg-[#1B6B45] text-white text-[14px] font-semibold px-5 py-2.5 rounded-full hover:bg-[#145538] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {stepIndex < totalSteps - 1 ? 'Weiter' : 'Zur Zusammenfassung'}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  // ─── Phase: Zusammenfassung ──────────────────────────────────────────────────
  if (phase === 'zusammenfassung') {
    const gruppen: { key: 'A' | 'B' | 'C'; label: string }[] = [
      { key: 'A', label: 'Basisdaten' },
      { key: 'B', label: 'Ausstattung & Zustand' },
      { key: 'C', label: 'Details' },
    ]

    return (
      <div className="space-y-6">
        <div className="bg-white border border-[#DDDDDD] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EEEEEE]">
            <h2 className="text-[16px] font-bold text-text-primary">Zusammenfassung deiner Angaben</h2>
            <p className="text-[13px] text-text-secondary mt-0.5">Modus: {modus ? MODUS_INFO[modus].label : ''}</p>
          </div>

          {gruppen.map(({ key, label }) => {
            const gruppenFragen = activeQuestions.filter(q => q.gruppe === key)
            if (gruppenFragen.length === 0) return null
            return (
              <div key={key} className="border-b border-[#EEEEEE] last:border-0">
                <div className="px-6 py-3 flex justify-between items-center bg-[#F7F7F7]">
                  <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-wide">{label}</span>
                  <button
                    onClick={() => jumpToGruppe(key)}
                    className="text-[12px] text-[#1B6B45] hover:underline font-medium"
                  >
                    Bearbeiten
                  </button>
                </div>
                <div className="divide-y divide-[#F7F7F7]">
                  {gruppenFragen.map(q => (
                    <div key={q.id} className="px-6 py-3 flex justify-between items-start gap-4">
                      <span className="text-[13px] text-text-secondary flex-1">{q.label}</span>
                      <span className="text-[13px] font-medium text-text-primary text-right max-w-[180px]">
                        {getAnswerLabel(q, answers)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            onClick={() => { setStepIndex(totalSteps - 1); setPhase('fragen') }}
            className="flex items-center gap-1.5 text-[14px] text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={16} />
            Zurück
          </button>
          <button
            onClick={handleBerechnen}
            className="flex items-center gap-2 bg-[#1B6B45] text-white text-[15px] font-semibold px-7 py-3 rounded-full hover:bg-[#145538] transition-colors shadow-sm"
          >
            Jetzt berechnen
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  // ─── Phase: Laden ────────────────────────────────────────────────────────────
  if (phase === 'laden') {
    return (
      <div className="bg-white border border-[#DDDDDD] rounded-xl p-16 flex flex-col items-center justify-center gap-6 min-h-[280px]">
        <div className="w-10 h-10 border-[3px] border-[#E8F5EE] border-t-[#1B6B45] rounded-full animate-spin" />
        <p className="text-[15px] font-medium text-text-primary transition-all">{ladeText}</p>
      </div>
    )
  }

  // ─── Phase: Ergebnis ─────────────────────────────────────────────────────────
  if (phase === 'ergebnis' && result) {
    return (
      <div className="space-y-5">
        {/* Preisspanne */}
        <div className="bg-white border border-[#DDDDDD] rounded-xl p-7">
          <p className="text-[12px] font-semibold text-text-secondary uppercase tracking-wide mb-2">Geschätzter Marktwert</p>
          <p className="text-[34px] font-bold text-text-primary leading-tight" style={{ letterSpacing: '-0.44px' }}>
            {formatEuro(result.min)} – {formatEuro(result.max)}
          </p>
          <p className="text-[15px] text-text-secondary mt-1">
            Mittelwert: ca. <span className="font-semibold text-text-primary">{formatEuro(result.mittelwert)}</span>
          </p>
          {modus && (
            <p className="text-[12px] text-text-tertiary mt-2">
              {MODUS_INFO[modus].genauigkeit} · Modus: {MODUS_INFO[modus].label}
            </p>
          )}
        </div>

        {/* Faktoren */}
        <div className="grid gap-4 sm:grid-cols-2">
          {result.positive_faktoren.length > 0 && (
            <div className="bg-white border border-[#DDDDDD] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-[#1B6B45]" />
                <p className="text-[13px] font-semibold text-[#1B6B45]">Positive Faktoren</p>
              </div>
              <ul className="space-y-2">
                {result.positive_faktoren.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#1B6B45] mt-0.5 text-[12px]">↑</span>
                    <span className="text-[13px] text-text-primary">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.negative_faktoren.length > 0 && (
            <div className="bg-white border border-[#DDDDDD] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={16} className="text-red-500" />
                <p className="text-[13px] font-semibold text-red-600">Faktoren die den Preis beeinflussen</p>
              </div>
              <ul className="space-y-2">
                {result.negative_faktoren.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 text-[12px]">↓</span>
                    <span className="text-[13px] text-text-primary">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Hinweis + Disclaimer */}
        {result.hinweis && (
          <p className="text-[13px] text-text-secondary px-1">{result.hinweis}</p>
        )}
        <div className="bg-[#F7F7F7] border border-[#EEEEEE] rounded-xl px-5 py-4">
          <p className="text-[12px] text-text-secondary leading-relaxed">
            ⚠ Diese Einschätzung basiert auf KI-Analyse und öffentlich bekannten Marktdaten. Sie ersetzt keine professionelle Immobilienbewertung durch einen zertifizierten Gutachter oder Makler.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={() => setPhase('modus')}
            className="flex items-center gap-2 border border-[#DDDDDD] text-text-primary text-[14px] font-medium px-5 py-2.5 rounded-full hover:border-[#1B6B45] hover:text-[#1B6B45] transition-colors"
          >
            <RefreshCw size={14} />
            Neue Berechnung
          </button>
          <Link
            href="/dashboard/expose"
            className="flex items-center gap-2 bg-[#1B6B45] text-white text-[14px] font-semibold px-5 py-2.5 rounded-full hover:bg-[#145538] transition-colors"
          >
            Inserat-Texte generieren
            <ArrowRight size={14} />
          </Link>
          <InlineButton
            prefilledQuestion={`Meine Immobilie wurde auf ${result ? result.min.toLocaleString('de-DE') + '–' + result.max.toLocaleString('de-DE') : 'einen bestimmten Wert'} € geschätzt. Wie kann ich beim Verkauf erfolgreich verhandeln?`}
            label="Verhandlungstaktik fragen"
          />
        </div>
      </div>
    )
  }

  return null
}
