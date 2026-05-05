'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, Plus, List, CalendarDays, X,
  Loader2, Users, Mail, AlertCircle, ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

// Supabase returns nested FK rows as arrays in the inferred type
interface TerminInteressent { interessent_id: string; eingeladen_per_mail: boolean; interessenten: { id: string; name: string; email: string | null }[] | { id: string; name: string; email: string | null } | null }
interface Termin { id: string; datum: string; uhrzeit_von: string; uhrzeit_bis: string; notiz: string | null; status: string; ical_uid: string; ical_sequence: number; termine_interessenten: TerminInteressent[] }
interface InteressentOption { id: string; name: string; email: string | null }

const inputBase = 'w-full rounded-[8px] border border-[#DDDDDD] px-4 min-h-[44px] text-[14px] text-text-primary bg-white outline-none transition-all focus:ring-2 focus:ring-accent focus:border-transparent placeholder:text-text-tertiary'
const labelBase = 'block text-[12px] font-semibold text-text-primary mb-1'

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const HOURS = Array.from({ length: 25 }, (_, i) => 8 + i * 0.5) // 8:00 to 20:00 (half hours)
const SLOT_HEIGHT = 28 // px per 30-min slot

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDisplayDateTime(termin: Termin): string {
  return `${formatDisplayDate(termin.datum)} · ${termin.uhrzeit_von.slice(0, 5)}–${termin.uhrzeit_bis.slice(0, 5)} Uhr`
}

const STATUS_COLORS: Record<string, string> = {
  geplant: 'bg-accent text-white',
  abgesagt: 'bg-[#EEEEEE] text-text-secondary',
  durchgefuehrt: 'bg-green-100 text-green-700',
}

interface TerminModalProps {
  initial?: Termin | null
  slotDate?: string
  slotTime?: string
  interessenten: InteressentOption[]
  onClose: () => void
  onCreate: (fd: FormData) => Promise<{ ok: boolean; error?: string }>
  onUpdate: (id: string, fd: FormData) => Promise<{ ok: boolean; error?: string }>
  onCancel: (id: string) => Promise<{ ok: boolean }>
}

function TerminModal({ initial, slotDate, slotTime, interessenten, onClose, onCreate, onUpdate, onCancel }: TerminModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initial ? initial.termine_interessenten.map((ti) => ti.interessent_id) : []
  )
  const [search, setSearch] = useState('')
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)

  const filteredOptions = useMemo(
    () => interessenten.filter((i) => i.name.toLowerCase().includes(search.toLowerCase())),
    [interessenten, search]
  )

  function toggleId(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('interessent_ids', JSON.stringify(selectedIds))

    startTransition(async () => {
      const result = initial ? await onUpdate(initial.id, fd) : await onCreate(fd)
      if (!result.ok) { setError(result.error ?? 'Fehler'); return }
      onClose()
      router.refresh()
    })
  }

  async function handleCancel() {
    startTransition(async () => {
      await onCancel(initial!.id)
      onClose()
      router.refresh()
    })
  }

  const defaultVon = slotTime ?? initial?.uhrzeit_von.slice(0, 5) ?? '10:00'
  const defaultBis = initial?.uhrzeit_bis.slice(0, 5) ?? (() => {
    const [h, m] = defaultVon.split(':').map(Number)
    const total = h * 60 + m + 30
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  })()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEEEEE] sticky top-0 bg-white z-10">
          <h2 className="text-[16px] font-bold text-text-primary">
            {initial ? 'Termin bearbeiten' : 'Neuer Termin'}
          </h2>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#FDECEA] rounded-lg">
              <AlertCircle size={13} className="text-[#C13515]" />
              <p className="text-[12px] text-[#C13515]">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 md:col-span-1">
              <label className={labelBase}>Datum *</label>
              <input name="datum" type="date" required defaultValue={slotDate ?? initial?.datum ?? formatDate(new Date())} className={inputBase} />
            </div>
            <div>
              <label className={labelBase}>Von *</label>
              <input name="uhrzeit_von" type="time" required defaultValue={defaultVon} className={inputBase} />
            </div>
            <div>
              <label className={labelBase}>Bis *</label>
              <input name="uhrzeit_bis" type="time" required defaultValue={defaultBis} className={inputBase} />
            </div>
          </div>

          <div>
            <label className={labelBase}>Notiz (intern)</label>
            <textarea name="notiz" rows={2} defaultValue={initial?.notiz ?? ''} placeholder="z. B. Schlüssel beim Nachbarn abholen" className={`${inputBase} py-3 min-h-[64px] resize-none`} />
          </div>

          {/* Interessenten Multi-Select */}
          <div>
            <label className={labelBase}>Interessenten einladen</label>
            {interessenten.length === 0 ? (
              <p className="text-[12px] text-text-secondary">
                Noch keine Interessenten angelegt. <Link href="/dashboard/interessenten" className="text-accent hover:underline">Jetzt anlegen →</Link>
              </p>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Name suchen…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`${inputBase} mb-2`}
                />
                <div className="max-h-[160px] overflow-y-auto border border-[#DDDDDD] rounded-[8px] divide-y divide-[#F5F5F5]">
                  {filteredOptions.map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => toggleId(i.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${selectedIds.includes(i.id) ? 'bg-accent-light' : 'hover:bg-surface'}`}
                    >
                      <span className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${selectedIds.includes(i.id) ? 'bg-accent border-accent' : 'border-[#CCCCCC]'}`}>
                        {selectedIds.includes(i.id) && (
                          <svg viewBox="0 0 10 8" width="10" height="8" fill="none">
                            <path d="M1 4l2.5 3L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-medium ${selectedIds.includes(i.id) ? 'text-accent' : 'text-text-primary'}`}>{i.name}</p>
                        {i.email && <p className="text-[11px] text-text-tertiary truncate">{i.email}</p>}
                      </div>
                    </button>
                  ))}
                </div>
                {selectedIds.length > 0 && (
                  <p className="text-[11px] text-text-secondary mt-1">{selectedIds.length} ausgewählt</p>
                )}
              </>
            )}
          </div>

          {selectedIds.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="send_mail" value="true" defaultChecked className="accent-accent w-4 h-4" />
              <span className="text-[13px] text-text-primary">Einladung per E-Mail mit iCal-Anhang senden</span>
            </label>
          )}

          <div className="flex gap-3 pt-2">
            {initial && initial.status === 'geplant' && (
              !showConfirmCancel ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmCancel(true)}
                  className="px-4 min-h-[44px] rounded-[8px] border border-[#DDDDDD] text-[13px] font-medium text-[#C13515] hover:bg-[#FDECEA] transition-colors"
                >
                  Absagen
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isPending}
                  className="px-4 min-h-[44px] rounded-[8px] bg-[#C13515] text-white text-[13px] font-semibold hover:bg-[#A52E12] transition-colors flex items-center gap-1.5"
                >
                  {isPending && <Loader2 size={12} className="animate-spin" />}
                  Wirklich absagen
                </button>
              )
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 min-h-[44px] rounded-[8px] border border-[#DDDDDD] text-[13px] font-medium text-text-primary hover:bg-surface transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1.5 px-5 min-h-[44px] rounded-[8px] bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold transition-colors disabled:opacity-70"
            >
              {isPending && <Loader2 size={12} className="animate-spin" />}
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Client Component ─────────────────────────────────────────────────

interface Props {
  termine: Termin[]
  interessenten: InteressentOption[]
  hasListing: boolean
  onCreate: (fd: FormData) => Promise<{ ok: boolean; error?: string }>
  onUpdate: (id: string, fd: FormData) => Promise<{ ok: boolean; error?: string }>
  onCancel: (id: string) => Promise<{ ok: boolean }>
}

export default function TermineClient({ termine, interessenten, hasListing, onCreate, onUpdate, onCancel }: Props) {
  const [view, setView] = useState<'week' | 'list'>('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [modal, setModal] = useState<{ open: boolean; termin?: Termin | null; slotDate?: string; slotTime?: string }>({ open: false })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekStart = useMemo(() => {
    const d = getWeekStart(today)
    d.setDate(d.getDate() + weekOffset * 7)
    return d
  }, [weekOffset, today])

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    }), [weekStart])

  const termineByDay = useMemo(() => {
    const map: Record<string, Termin[]> = {}
    for (const t of termine) {
      if (!map[t.datum]) map[t.datum] = []
      map[t.datum].push(t)
    }
    return map
  }, [termine])

  function openSlot(date: string, time: string) {
    if (!hasListing) return
    setModal({ open: true, slotDate: date, slotTime: time })
  }

  const futureTermine = termine.filter((t) => new Date(t.datum + 'T23:59') >= today).sort((a, b) => a.datum.localeCompare(b.datum) || a.uhrzeit_von.localeCompare(b.uhrzeit_von))
  const pastTermine = termine.filter((t) => new Date(t.datum + 'T23:59') < today).sort((a, b) => b.datum.localeCompare(a.datum))

  const weekLabel = (() => {
    const end = new Date(weekStart)
    end.setDate(end.getDate() + 6)
    return `${weekStart.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}`
  })()

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center bg-surface rounded-[8px] p-0.5">
          <button
            type="button"
            onClick={() => setView('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors ${view === 'week' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <CalendarDays size={14} />Woche
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors ${view === 'list' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <List size={14} />Liste
          </button>
        </div>

        {view === 'week' && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setWeekOffset((o) => o - 1)} className="w-8 h-8 rounded-full border border-[#DDDDDD] flex items-center justify-center hover:bg-surface transition-colors">
              <ChevronLeft size={14} />
            </button>
            <button type="button" onClick={() => setWeekOffset(0)} className="text-[13px] font-medium text-text-secondary hover:text-accent transition-colors px-2">
              Heute
            </button>
            <button type="button" onClick={() => setWeekOffset((o) => o + 1)} className="w-8 h-8 rounded-full border border-[#DDDDDD] flex items-center justify-center hover:bg-surface transition-colors">
              <ChevronRight size={14} />
            </button>
            <span className="text-[13px] font-medium text-text-primary">{weekLabel}</span>
          </div>
        )}

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setModal({ open: true })}
          disabled={!hasListing}
          className="flex items-center gap-1.5 px-4 min-h-[38px] rounded-[8px] bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={14} />Neuer Termin
        </button>
      </div>

      {/* WEEK VIEW */}
      {view === 'week' && (
        <div className="bg-white border border-[#DDDDDD] rounded-xl overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-[#EEEEEE]">
            <div className="py-2" />
            {weekDays.map((d, i) => {
              const isToday = formatDate(d) === formatDate(today)
              return (
                <div key={i} className={`text-center py-2 border-l border-[#F5F5F5] ${isToday ? 'bg-accent-light' : ''}`}>
                  <p className="text-[11px] font-semibold text-text-secondary">{DAYS[i]}</p>
                  <p className={`text-[14px] font-bold ${isToday ? 'text-accent' : 'text-text-primary'}`}>
                    {d.getDate()}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Time grid */}
          <div className="overflow-y-auto" style={{ maxHeight: '520px' }}>
            <div className="relative grid grid-cols-[48px_repeat(7,1fr)]">
              {/* Hour labels */}
              <div>
                {Array.from({ length: 25 }, (_, i) => {
                  const h = 8 + Math.floor(i / 2)
                  const m = i % 2 === 0 ? '00' : '30'
                  return (
                    <div key={i} style={{ height: SLOT_HEIGHT }} className="flex items-start justify-end pr-2 pt-0.5">
                      {i % 2 === 0 && (
                        <span className="text-[10px] text-text-tertiary">{h}:00</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Day columns */}
              {weekDays.map((d, dayIdx) => {
                const dateStr = formatDate(d)
                const dayTermine = (termineByDay[dateStr] ?? []).filter((t) => t.status !== 'abgesagt')
                const isToday = dateStr === formatDate(today)

                return (
                  <div key={dayIdx} className={`relative border-l border-[#F5F5F5] ${isToday ? 'bg-accent-light/20' : ''}`}>
                    {/* Slot click areas */}
                    {Array.from({ length: 25 }, (_, slotIdx) => {
                      const h = 8 + Math.floor(slotIdx / 2)
                      const m = slotIdx % 2 === 0 ? '00' : '30'
                      return (
                        <div
                          key={slotIdx}
                          style={{ height: SLOT_HEIGHT }}
                          onClick={() => openSlot(dateStr, `${String(h).padStart(2, '0')}:${m}`)}
                          className={`border-b border-[#F5F5F5] cursor-pointer hover:bg-accent-light/30 transition-colors ${slotIdx % 2 === 0 ? '' : 'border-dashed'}`}
                        />
                      )
                    })}

                    {/* Appointment blocks */}
                    {dayTermine.map((t) => {
                      const startMin = timeToMinutes(t.uhrzeit_von) - 8 * 60
                      const endMin = timeToMinutes(t.uhrzeit_bis) - 8 * 60
                      const top = (startMin / 30) * SLOT_HEIGHT
                      const height = Math.max(((endMin - startMin) / 30) * SLOT_HEIGHT, SLOT_HEIGHT)
                      const names = t.termine_interessenten.map((ti) => Array.isArray(ti.interessenten) ? ti.interessenten[0]?.name : ti.interessenten?.name).filter(Boolean)

                      return (
                        <div
                          key={t.id}
                          style={{ top, height, left: 2, right: 2 }}
                          onClick={(e) => { e.stopPropagation(); setModal({ open: true, termin: t }) }}
                          className="absolute rounded-[4px] bg-accent text-white px-1.5 py-0.5 overflow-hidden cursor-pointer hover:bg-accent-hover transition-colors z-10"
                        >
                          <p className="text-[10px] font-semibold leading-tight truncate">
                            {t.uhrzeit_von.slice(0, 5)}
                          </p>
                          {names.length > 0 && (
                            <p className="text-[9px] opacity-80 truncate">{names.join(', ')}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="space-y-4">
          {futureTermine.length === 0 && pastTermine.length === 0 ? (
            <div className="bg-white border border-[#DDDDDD] rounded-xl p-10 flex flex-col items-center text-center">
              <CalendarDays size={32} className="text-text-tertiary mb-3" strokeWidth={1.5} />
              <p className="text-[15px] font-semibold text-text-primary mb-1">Noch keine Termine</p>
              <p className="text-[13px] text-text-secondary">Lege deinen ersten Besichtigungstermin an.</p>
            </div>
          ) : (
            <>
              {futureTermine.length > 0 && (
                <div className="bg-white border border-[#DDDDDD] rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#EEEEEE]">
                    <p className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">Anstehende Termine</p>
                  </div>
                  {futureTermine.map((t) => <TerminRow key={t.id} t={t} onEdit={() => setModal({ open: true, termin: t })} />)}
                </div>
              )}

              {pastTermine.length > 0 && (
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer text-[13px] font-medium text-text-secondary hover:text-text-primary list-none py-2">
                    <ChevronRight size={14} className="group-open:rotate-90 transition-transform" />
                    {pastTermine.length} vergangene{pastTermine.length !== 1 ? 'r' : ''} Termin{pastTermine.length !== 1 ? 'e' : ''}
                  </summary>
                  <div className="bg-white border border-[#DDDDDD] rounded-xl overflow-hidden mt-2">
                    {pastTermine.map((t) => <TerminRow key={t.id} t={t} onEdit={() => setModal({ open: true, termin: t })} />)}
                  </div>
                </details>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <TerminModal
          initial={modal.termin}
          slotDate={modal.slotDate}
          slotTime={modal.slotTime}
          interessenten={interessenten}
          onClose={() => setModal({ open: false })}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onCancel={onCancel}
        />
      )}
    </>
  )
}

function TerminRow({ t, onEdit }: { t: Termin; onEdit: () => void }) {
  const names = t.termine_interessenten.map((ti) => Array.isArray(ti.interessenten) ? ti.interessenten[0]?.name : ti.interessenten?.name).filter(Boolean)
  const hasMail = t.termine_interessenten.some((ti) => ti.eingeladen_per_mail)
  return (
    <div
      onClick={onEdit}
      className="flex items-center gap-4 px-5 py-3.5 border-b border-[#F5F5F5] last:border-0 hover:bg-surface cursor-pointer transition-colors"
    >
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === 'abgesagt' ? 'bg-[#DDDDDD]' : t.status === 'durchgefuehrt' ? 'bg-green-400' : 'bg-accent'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-text-primary">
          {formatDisplayDateTime(t)}
        </p>
        {names.length > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Users size={11} className="text-text-tertiary" />
            <p className="text-[12px] text-text-secondary truncate">{names.join(', ')}</p>
          </div>
        )}
        {t.notiz && <p className="text-[11px] text-text-tertiary truncate">{t.notiz}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {hasMail && <Mail size={12} className="text-text-tertiary" aria-label="Einladung versendet" />}
        {names.length > 0 && (
          <Link
            href={`/dashboard/interessenten/${t.termine_interessenten[0]?.interessent_id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-text-tertiary hover:text-accent transition-colors"
            title="Interessenten-Profil"
          >
            <ExternalLink size={12} />
          </Link>
        )}
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status] ?? 'bg-[#EEEEEE] text-text-secondary'}`}>
          {t.status === 'geplant' ? 'Geplant' : t.status === 'abgesagt' ? 'Abgesagt' : 'Durchgeführt'}
        </span>
      </div>
    </div>
  )
}
