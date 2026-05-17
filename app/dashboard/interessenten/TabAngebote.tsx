'use client'

import { useState, useEffect, useTransition } from 'react'
import { PlusCircle, Loader2 } from 'lucide-react'
import { getAngeboteHistorie, createAngebot, type AngebotHistorieEintrag } from './actions'
import NeuesAngebotModal from './NeuesAngebotModal'

const BONITAET_DISPLAY: Record<string, { label: string; color: string; bg: string }> = {
  bestaetigt: { label: '✓ Bestätigt', color: '#1B6B45', bg: '#E8F5EE' },
  unklar: { label: '⚠ Unklar', color: '#C07000', bg: '#FFF8EC' },
  kritisch: { label: '✗ Kritisch', color: '#D04A2C', bg: '#FDECEA' },
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

interface Props {
  interessent: Record<string, unknown>
}

export default function TabAngebote({ interessent }: Props) {
  const [eintraege, setEintraege] = useState<AngebotHistorieEintrag[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [, startTransition] = useTransition()

  const interessentId = interessent.id as string

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getAngeboteHistorie(interessentId).then(result => {
      if (cancelled) return
      if (result.ok && result.data) setEintraege(result.data)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [interessentId])

  function handleSuccess(betrag: number) {
    startTransition(() => {
      getAngeboteHistorie(interessentId).then(result => {
        if (result.ok && result.data) setEintraege(result.data)
      })
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-text-primary uppercase tracking-wide">
          Verhandlungs-Historie
        </h3>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B6B45] text-white rounded-md text-[12px] font-medium hover:bg-[#145538] transition-colors"
        >
          <PlusCircle size={13} />
          Neues Angebot
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-text-tertiary">
          <Loader2 size={18} className="animate-spin" />
        </div>
      ) : eintraege.length === 0 ? (
        <p className="text-[13px] text-text-tertiary text-center py-8">
          Noch keine Angebote — sobald ein Angebot eingetragen wird, erscheint es hier.
        </p>
      ) : (
        <div className="space-y-3">
          {eintraege.map((e, idx) => {
            const bonitaet = e.bonitaet_snapshot ? BONITAET_DISPLAY[e.bonitaet_snapshot] : null
            return (
              <div key={e.id} className="relative pl-5">
                {/* Timeline-Linie */}
                {idx < eintraege.length - 1 && (
                  <span className="absolute left-1.5 top-5 bottom-0 w-px bg-gray-200" />
                )}
                {/* Dot */}
                <span className="absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-[#1B6B45] bg-white" />

                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[17px] font-bold text-text-primary">{formatPrice(e.betrag)}</p>
                    <p className="text-[11px] text-text-tertiary whitespace-nowrap mt-0.5">{formatDate(e.erstellt_am)}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {bonitaet && (
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{ color: bonitaet.color, backgroundColor: bonitaet.bg }}
                      >
                        {bonitaet.label}
                      </span>
                    )}
                    {e.bankbestaetigung_snapshot && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium text-[#1B6B45] bg-[#E8F5EE]">
                        ✓ Bank
                      </span>
                    )}
                  </div>

                  {e.kommentar && (
                    <p className="text-[12px] text-text-secondary mt-1.5 italic">{e.kommentar}</p>
                  )}
                  {e.bonitaet_notiz_snapshot && (
                    <p className="text-[11px] text-text-tertiary mt-1">{e.bonitaet_notiz_snapshot}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <NeuesAngebotModal
          interessentId={interessentId}
          onClose={() => setModalOpen(false)}
          onSuccess={handleSuccess}
          onSubmit={createAngebot}
        />
      )}
    </div>
  )
}
