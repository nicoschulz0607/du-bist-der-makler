'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Download, X, ChevronDown, Search, Loader2 } from 'lucide-react'
import type { Tier } from '@/lib/tier'

interface Interessent {
  id: string
  name: string
  email: string | null
  telefon: string | null
  status: string
  quelle: string | null
  ki_ampel: string | null
  ki_score: number | null
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  neu: 'Neu',
  vorqualifiziert: 'Vorqualifiziert',
  besichtigung_geplant: 'Besichtigung geplant',
  besichtigt: 'Besichtigt',
  angebot_abgegeben: 'Angebot abgegeben',
  verhandlung: 'Verhandlung',
  zugesagt: 'Zugesagt',
  abgesagt: 'Abgesagt',
}

const STATUS_COLORS: Record<string, string> = {
  neu: 'bg-blue-50 text-blue-700',
  vorqualifiziert: 'bg-purple-50 text-purple-700',
  besichtigung_geplant: 'bg-yellow-50 text-yellow-700',
  besichtigt: 'bg-orange-50 text-orange-700',
  angebot_abgegeben: 'bg-accent-light text-accent',
  verhandlung: 'bg-accent-light text-accent',
  zugesagt: 'bg-green-100 text-green-700',
  abgesagt: 'bg-[#EEEEEE] text-text-secondary',
}

const QUELLE_LABELS: Record<string, string> = {
  eigene_seite: 'Eigene Seite',
  immoscout: 'ImmoScout',
  kleinanzeigen: 'Kleinanzeigen',
  manuell: 'Manuell',
}

function AmpelDot({ ampel, score }: { ampel: string | null; score: number | null }) {
  if (!ampel) return <span className="w-2.5 h-2.5 rounded-full bg-[#DDDDDD] inline-block" title="Kein KI-Score" />
  const color = ampel === 'gruen' ? 'bg-green-500' : ampel === 'gelb' ? 'bg-yellow-400' : 'bg-red-500'
  return (
    <span
      className={`w-2.5 h-2.5 rounded-full inline-block ${color}`}
      title={score ? `KI-Score: ${score}/10` : 'KI-Score vorhanden'}
    />
  )
}

const inputBase =
  'w-full rounded-[8px] border border-[#DDDDDD] px-4 min-h-[44px] text-[14px] text-text-primary bg-white outline-none transition-all duration-200 placeholder:text-text-tertiary focus:ring-2 focus:ring-accent focus:border-transparent'

interface Props {
  interessenten: Interessent[]
  hasListing: boolean
  tier: Tier
  onCreate: (formData: FormData) => Promise<{ ok: boolean; id?: string; error?: string }>
  onDelete: (id: string) => Promise<{ ok: boolean }>
}

export default function InteressentenClient({ interessenten, hasListing, onCreate, onDelete }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterAmpel, setFilterAmpel] = useState<string>('')
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return interessenten.filter((i) => {
      if (filterStatus && i.status !== filterStatus) return false
      if (filterAmpel && i.ki_ampel !== filterAmpel) return false
      if (search) {
        const q = search.toLowerCase()
        if (!i.name.toLowerCase().includes(q) && !(i.email ?? '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [interessenten, filterStatus, filterAmpel, search])

  function handleRowClick(id: string) {
    router.push(`/dashboard/interessenten/${id}`)
  }

  function exportCsv() {
    const header = ['Name', 'E-Mail', 'Telefon', 'Status', 'Quelle', 'KI-Ampel', 'KI-Score', 'Erstellt am']
    const rows = filtered.map((i) => [
      i.name,
      i.email ?? '',
      i.telefon ?? '',
      STATUS_LABELS[i.status] ?? i.status,
      i.quelle ? (QUELLE_LABELS[i.quelle] ?? i.quelle) : '',
      i.ki_ampel ?? '',
      i.ki_score?.toString() ?? '',
      new Date(i.created_at).toLocaleDateString('de-DE'),
    ])
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'interessenten.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await onCreate(fd)
      if (!result.ok) {
        setFormError(result.error ?? 'Fehler')
        return
      }
      setShowModal(false)
      router.refresh()
      if (result.id) router.push(`/dashboard/interessenten/${result.id}`)
    })
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (!confirm('Interessent wirklich löschen?')) return
    setDeletingId(id)
    await onDelete(id)
    setDeletingId(null)
    router.refresh()
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Name oder E-Mail suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 min-h-[38px] rounded-[8px] border border-[#DDDDDD] text-[13px] text-text-primary bg-white outline-none focus:ring-2 focus:ring-accent focus:border-transparent w-[220px]"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none pl-3 pr-8 min-h-[38px] rounded-[8px] border border-[#DDDDDD] text-[13px] text-text-primary bg-white outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="">Alle Status</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
        </div>

        {/* Ampel filter */}
        <div className="relative">
          <select
            value={filterAmpel}
            onChange={(e) => setFilterAmpel(e.target.value)}
            className="appearance-none pl-3 pr-8 min-h-[38px] rounded-[8px] border border-[#DDDDDD] text-[13px] text-text-primary bg-white outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="">Alle Ampeln</option>
            <option value="gruen">🟢 Grün</option>
            <option value="gelb">🟡 Gelb</option>
            <option value="rot">🔴 Rot</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={exportCsv}
          className="flex items-center gap-1.5 px-3 min-h-[38px] rounded-[8px] border border-[#DDDDDD] text-[13px] font-medium text-text-primary bg-white hover:bg-surface-mid transition-colors"
        >
          <Download size={14} />
          CSV
        </button>

        <button
          type="button"
          onClick={() => { if (hasListing) setShowModal(true) }}
          disabled={!hasListing}
          className="flex items-center gap-1.5 px-4 min-h-[38px] rounded-[8px] bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={14} />
          Neuer Interessent
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#DDDDDD] rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center">
            <p className="text-[15px] font-semibold text-text-primary mb-1">
              {interessenten.length === 0 ? 'Noch keine Interessenten' : 'Keine Treffer'}
            </p>
            <p className="text-[13px] text-text-secondary">
              {interessenten.length === 0
                ? 'Lege den ersten Interessenten manuell an oder warte auf Anfragen.'
                : 'Passe die Filter an.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EEEEEE]">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">KI</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">Quelle</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">Erstellt</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr
                  key={i.id}
                  onClick={() => handleRowClick(i.id)}
                  className="border-b border-[#F5F5F5] last:border-0 hover:bg-surface cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <p className="text-[13px] font-semibold text-text-primary">{i.name}</p>
                    {i.email && <p className="text-[12px] text-text-secondary truncate max-w-[180px]">{i.email}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[i.status] ?? 'bg-[#EEEEEE] text-text-secondary'}`}>
                      {STATUS_LABELS[i.status] ?? i.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <AmpelDot ampel={i.ki_ampel} score={i.ki_score} />
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-[12px] text-text-secondary">
                      {i.quelle ? (QUELLE_LABELS[i.quelle] ?? i.quelle) : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-[12px] text-text-secondary">
                      {new Date(i.created_at).toLocaleDateString('de-DE')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, i.id)}
                      disabled={deletingId === i.id}
                      className="text-text-tertiary hover:text-[#C13515] transition-colors p-1"
                      title="Löschen"
                    >
                      {deletingId === i.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New Interessent Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEEEEE]">
              <h2 className="text-[16px] font-bold text-text-primary">Neuer Interessent</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-text-secondary hover:text-text-primary">
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
                <textarea name="nachricht" rows={3} placeholder="Erste Nachricht des Interessenten…" className={`${inputBase} py-3 resize-none min-h-[80px]`} />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
      )}
    </>
  )
}
