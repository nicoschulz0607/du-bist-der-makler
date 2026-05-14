'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Wand2, Pencil, Check, X, RefreshCw } from 'lucide-react'
import { generiereInseratTexte, saveExposeEdits } from '@/lib/wizard/actions'
import type { ExposeOutput } from '@/lib/claude/expose'

interface Props {
  listingId: string | null
  initialExposeHtml: string | null
  initialExposeEdits: Record<string, unknown> | null
  onCanAdvanceChange: (can: boolean) => void
}

type GenState = 'idle' | 'generating' | 'done' | 'error'

const LOADING_TEXTS = [
  'Schreibe Inserat-Titel…',
  'Erstelle Kurzbeschreibung…',
  'Formuliere Volltext…',
  'Formuliere Volltext…',
]

function mergeExpose(
  html: string | null,
  edits: Record<string, unknown> | null
): ExposeOutput | null {
  if (!html) return null
  try {
    const base = JSON.parse(html) as ExposeOutput
    if (!edits) return base
    return { ...base, ...edits } as ExposeOutput
  } catch {
    return null
  }
}

interface EditableCardProps {
  label: string
  fieldKey: keyof ExposeOutput
  value: string
  multiline?: boolean
  maxLength?: number
  onSave: (key: keyof ExposeOutput, value: string) => void
}

function EditableCard({ label, fieldKey, value, multiline, maxLength, onSave }: EditableCardProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  function handleSave() {
    setEditing(false)
    onSave(fieldKey, draft)
  }

  function handleCancel() {
    setDraft(value)
    setEditing(false)
  }

  return (
    <div className="rounded-2xl border border-[#EEEEEE] bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{label}</span>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-[12px] text-text-tertiary hover:text-[#1B6B45] transition-colors"
          >
            <Pencil size={12} /> Bearbeiten
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          {multiline ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={maxLength}
              rows={6}
              autoFocus
              className="w-full border border-[#1B6B45] rounded-xl px-4 py-3 text-[14px] text-text-primary resize-none focus:outline-none"
            />
          ) : (
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={maxLength}
              autoFocus
              className="w-full border border-[#1B6B45] rounded-xl px-4 py-2.5 text-[14px] text-text-primary focus:outline-none"
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 text-[12px] font-semibold text-white bg-[#1B6B45] px-3 py-1.5 rounded-lg hover:bg-[#154F34] transition-colors"
            >
              <Check size={12} /> Speichern
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 text-[12px] text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg border border-[#EEEEEE]"
            >
              <X size={12} /> Abbrechen
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[14px] text-text-primary leading-relaxed whitespace-pre-wrap">{value || '—'}</p>
      )}
    </div>
  )
}

export default function Station7Texte({
  listingId,
  initialExposeHtml,
  initialExposeEdits,
  onCanAdvanceChange,
}: Props) {
  const initExpose = mergeExpose(initialExposeHtml, initialExposeEdits)
  const [genState, setGenState] = useState<GenState>(initExpose?.titel ? 'done' : 'idle')
  const [expose, setExpose] = useState<ExposeOutput | null>(initExpose)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loadingTextIdx, setLoadingTextIdx] = useState(0)
  const [isPending, startTransition] = useTransition()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    onCanAdvanceChange(!!expose?.titel)
  }, [expose, onCanAdvanceChange])

  useEffect(() => {
    if (genState === 'generating') {
      intervalRef.current = setInterval(() => {
        setLoadingTextIdx((i) => (i + 1) % LOADING_TEXTS.length)
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [genState])

  function startGeneration() {
    if (!listingId || genState === 'generating') return
    setGenState('generating')
    setErrorMsg(null)
    setLoadingTextIdx(0)

    startTransition(async () => {
      const [result] = await Promise.all([
        generiereInseratTexte(listingId),
        new Promise<void>((r) => setTimeout(r, 3000)),
      ])

      if (result.success && result.expose) {
        setExpose(result.expose)
        setGenState('done')
      } else {
        setErrorMsg(result.error ?? 'Generierung fehlgeschlagen.')
        setGenState('error')
      }
    })
  }

  function handleSaveField(key: keyof ExposeOutput, value: string) {
    if (!listingId || !expose) return
    const updated = { ...expose, [key]: key === 'highlights' ? value.split('\n').filter(Boolean) : value }
    setExpose(updated)
    startTransition(async () => {
      const edits: Partial<ExposeOutput> = {
        [key]: key === 'highlights' ? value.split('\n').filter(Boolean) : value,
      }
      await saveExposeEdits(listingId, edits)
    })
  }

  function getDisplayValue(key: keyof ExposeOutput): string {
    if (!expose) return ''
    const val = expose[key]
    if (Array.isArray(val)) return (val as string[]).join('\n')
    return String(val ?? '')
  }

  if (genState === 'idle') {
    return (
      <div className="rounded-2xl border border-[#EEEEEE] bg-gradient-to-br from-[#FAFAFA] to-white p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#E8F5EE] flex items-center justify-center mx-auto mb-5">
          <Wand2 size={24} className="text-[#1B6B45]" />
        </div>
        <h3 className="text-[17px] font-bold text-text-primary mb-2">KI schreibt deine Inserat-Texte</h3>
        <p className="text-[14px] text-text-secondary mb-6 max-w-md mx-auto leading-relaxed">
          Aus deinen Objektdaten, Ausstattung und Beschreibung generieren wir Titel, Kurzbeschreibung, Volltext und Highlights — alles im Stil einer professionellen Immobilien-Anzeige.
        </p>
        <button
          onClick={startGeneration}
          disabled={!listingId || isPending}
          className="bg-[#1B6B45] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#154F34] transition-colors disabled:opacity-60"
        >
          Texte jetzt generieren
        </button>
        {!listingId && (
          <p className="text-[12px] text-text-tertiary mt-3">Bitte erst Station 1 (Grunddaten) ausfüllen.</p>
        )}
      </div>
    )
  }

  if (genState === 'generating') {
    return (
      <div className="rounded-2xl border border-[#EEEEEE] bg-gradient-to-br from-[#FAFAFA] to-white p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#E8F5EE] flex items-center justify-center mx-auto mb-5">
          <Wand2 size={24} className="text-[#1B6B45] animate-pulse" />
        </div>
        <p className="text-[16px] font-semibold text-text-primary animate-pulse">
          {LOADING_TEXTS[loadingTextIdx]}
        </p>
        <p className="text-[13px] text-text-secondary mt-2">Einen Moment Geduld…</p>
      </div>
    )
  }

  if (genState === 'error') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5 text-center">
          <p className="text-[14px] font-semibold text-red-800 mb-1">Generierung fehlgeschlagen</p>
          <p className="text-[13px] text-red-700">{errorMsg}</p>
        </div>
        <button
          onClick={() => setGenState('idle')}
          className="text-[13px] text-text-tertiary hover:text-text-secondary underline"
        >
          Erneut versuchen
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <EditableCard
        label="Titel"
        fieldKey="titel"
        value={getDisplayValue('titel')}
        maxLength={80}
        onSave={handleSaveField}
      />
      <EditableCard
        label="Kurzbeschreibung"
        fieldKey="beschreibung_kurz"
        value={getDisplayValue('beschreibung_kurz')}
        multiline
        maxLength={400}
        onSave={handleSaveField}
      />
      <EditableCard
        label="Volltext"
        fieldKey="beschreibung_lang"
        value={getDisplayValue('beschreibung_lang')}
        multiline
        maxLength={4000}
        onSave={handleSaveField}
      />
      <EditableCard
        label="Highlights (je Zeile ein Punkt)"
        fieldKey="highlights"
        value={getDisplayValue('highlights')}
        multiline
        maxLength={600}
        onSave={handleSaveField}
      />

      <button
        onClick={startGeneration}
        disabled={isPending}
        className="flex items-center gap-2 text-[13px] text-text-secondary hover:text-text-primary border border-[#EEEEEE] rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50"
      >
        <RefreshCw size={14} /> Neu generieren (überschreibt alles)
      </button>
    </div>
  )
}
