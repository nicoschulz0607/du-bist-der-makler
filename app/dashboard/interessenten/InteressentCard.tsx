'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import InteressentTabs from './InteressentTabs'

const STATUS_LABEL: Record<string, string> = {
  neu: 'Neu',
  vorqualifiziert: 'Vorqualifiziert',
  besichtigung_geplant: 'Besichtigung geplant',
  besichtigt: 'Besichtigt',
  angebot_abgegeben: 'Angebot abgegeben',
  verhandlung: 'Verhandlung',
  zugesagt: 'Zugesagt',
  abgesagt: 'Abgesagt',
}

const QUELLE_LABEL: Record<string, string> = {
  eigene_seite: 'Eigene Seite',
  immoscout: 'ImmoScout24',
  kleinanzeigen: 'Kleinanzeigen',
  manuell: 'Manuell',
}

const BONITAET_DISPLAY: Record<string, { label: string; color: string; icon: string }> = {
  bestaetigt: { label: 'Bestätigt', color: '#1B6B45', icon: '✓' },
  unklar: { label: 'Unklar', color: '#C07000', icon: '⚠' },
  kritisch: { label: 'Kritisch', color: '#D04A2C', icon: '✗' },
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—'
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'heute'
  if (diffDays === 1) return 'gestern'
  return `vor ${diffDays} Tagen`
}

function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

interface Props {
  interessent: Record<string, unknown>
  open: boolean
  activeTab: string
  tier: string
  onToggle: () => void
  onTabChange: (tab: string) => void
}

export default function InteressentCard({ interessent, open, activeTab, tier, onToggle, onTabChange }: Props) {
  const unbeantwortet = interessent.antwortet_am === null
  const bonitaet = interessent.bonitaet ? BONITAET_DISPLAY[interessent.bonitaet as string] : null
  const status = interessent.status as string | null

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden transition-all ${
        open ? 'border-2 border-[#1B6B45]/30' : 'border border-gray-200'
      }`}
    >
      <div className="p-4">
        {/* Name + Status + Kontakt + Score + Zeit */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {unbeantwortet && (
              <span className="w-2 h-2 rounded-full bg-[#D04A2C] flex-shrink-0 mt-1" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="text-[15px] font-semibold truncate">{interessent.name as string}</p>
                {status && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-text-secondary font-medium whitespace-nowrap">
                    {STATUS_LABEL[status] ?? status}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-text-secondary truncate">
                {interessent.email as string}
                {interessent.telefon ? ` · ${interessent.telefon as string}` : null}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {interessent.ki_score != null && (
              <span
                className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: '#FAEEDA', color: '#854F0B' }}
              >
                ⚡ {interessent.ki_score as number}/10
              </span>
            )}
            <span className="text-[11px] text-text-tertiary">
              {formatRelative(interessent.created_at as string)}
            </span>
          </div>
        </div>

        {/* Info-Reihe: Quelle / Bonität / Angebot */}
        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-200">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-tertiary mb-0.5">Quelle</p>
            <p className="text-[12px] font-medium">
              {QUELLE_LABEL[interessent.quelle as string] ?? (interessent.quelle as string) ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-tertiary mb-0.5">Bonität</p>
            <p
              className="text-[12px] font-medium"
              style={{ color: bonitaet?.color ?? 'var(--color-text-tertiary)' }}
            >
              {bonitaet ? `${bonitaet.icon} ${bonitaet.label}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-tertiary mb-0.5">Angebot</p>
            <p className="text-[12px] font-medium">
              {formatPrice(interessent.abgegebenes_angebot as number | null)}
            </p>
          </div>
        </div>

        {/* Preview + Toggle-Button */}
        {!open && (
          <div className="flex items-center justify-between mt-3">
            {interessent.nachricht ? (
              <p className="text-[12px] text-text-tertiary italic truncate flex-1 mr-2">
                &ldquo;{(interessent.nachricht as string).slice(0, 80)}
                {(interessent.nachricht as string).length > 80 ? '…' : ''}&rdquo;
              </p>
            ) : (
              <div className="flex-1" />
            )}
            <button
              onClick={onToggle}
              className="flex items-center gap-1 text-[12px] text-accent hover:opacity-80 flex-shrink-0"
            >
              Details <ChevronDown size={14} />
            </button>
          </div>
        )}

        {open && (
          <div className="flex justify-end mt-3">
            <button
              onClick={onToggle}
              className="flex items-center gap-1 text-[12px] text-text-secondary hover:text-text-primary"
            >
              Schließen <ChevronUp size={14} />
            </button>
          </div>
        )}
      </div>

      {open && (
        <InteressentTabs
          interessent={interessent}
          activeTab={activeTab}
          tier={tier}
          onTabChange={onTabChange}
        />
      )}
    </div>
  )
}
