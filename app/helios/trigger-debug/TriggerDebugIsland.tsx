'use client'

import { useRouter } from 'next/navigation'
import type { HeliosKunde } from '@/lib/helios/sources/supabase'
import type { TriggerSignal } from '@/lib/klara/triggers'

type CtxSummary = {
  listing_status: string | null
  listing_tage: number | null
  interessenten_gesamt: number
  aelteste_unbeantwortet: { name: string; wartet_seit_stunden: number } | null
  termin_in_stunden: number | null
  paket_tage: number | null
  aktivitaet_tage: number | null
}

type TriggerDebugData = {
  signals: TriggerSignal[]
  primary: TriggerSignal | null
  ctxSummary: CtxSummary
}

interface Props {
  kunden: HeliosKunde[]
  selectedUserId: string | null
  triggerData: TriggerDebugData | null
}

const SCHWERE_STYLES: Record<string, string> = {
  wichtig: 'bg-helios-danger/10 text-helios-danger border border-helios-danger/20',
  hinweis: 'bg-helios-warning/10 text-helios-warning border border-helios-warning/20',
  info:    'bg-helios-border text-helios-text-muted border border-helios-border',
}

function SchwereBadge({ schwere }: { schwere: string }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide ${SCHWERE_STYLES[schwere] ?? SCHWERE_STYLES.info}`}>
      {schwere}
    </span>
  )
}

function SignalCard({ signal, highlight }: { signal: TriggerSignal; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? 'border-helios-accent bg-helios-accent-soft' : 'border-helios-border bg-helios-surface'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <SchwereBadge schwere={signal.schwere} />
          <span className="text-xs text-helios-text-subtle font-mono">prio {signal.prioritaet}</span>
          {highlight && <span className="text-xs font-semibold text-helios-accent">← primary</span>}
        </div>
      </div>

      <p className="mt-2 text-sm font-semibold text-helios-text">{signal.titel}</p>
      <p className="text-sm text-helios-text-muted">{signal.beschreibung}</p>

      {signal.klara_einstieg && (
        <p className="mt-2 text-xs italic text-helios-text-subtle border-l-2 border-helios-accent/30 pl-2">
          {signal.klara_einstieg}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <span className="text-xs text-helios-text-subtle">→ {signal.empfohlene_aktion}</span>
        {signal.link_ziel && (
          <span className="text-xs font-mono text-helios-text-subtle">{signal.link_ziel}</span>
        )}
      </div>
    </div>
  )
}

function CtxSummaryCard({ summary }: { summary: CtxSummary }) {
  const rows: [string, string][] = [
    ['Listing-Status',       summary.listing_status ?? '—'],
    ['Listing-Alter',        summary.listing_tage !== null ? `${summary.listing_tage} Tage` : '—'],
    ['Interessenten gesamt', String(summary.interessenten_gesamt)],
    ['Älteste unbeantw.',    summary.aelteste_unbeantwortet
      ? `${summary.aelteste_unbeantwortet.name} (${summary.aelteste_unbeantwortet.wartet_seit_stunden}h)`
      : '—'],
    ['Nächster Termin',      summary.termin_in_stunden !== null ? `in ${summary.termin_in_stunden}h` : '—'],
    ['Paket-Tage',           summary.paket_tage !== null ? `${summary.paket_tage} Tage` : '—'],
    ['Letzte Aktivität',     summary.aktivitaet_tage !== null ? `vor ${summary.aktivitaet_tage} Tagen` : '—'],
  ]

  return (
    <div className="rounded-xl border border-helios-border bg-helios-surface p-4">
      <p className="text-xs font-semibold text-helios-text-subtle uppercase tracking-widest mb-3">Kontext-Zusammenfassung</p>
      <div className="divide-y divide-helios-border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between py-1.5 text-sm">
            <span className="text-helios-text-muted">{label}</span>
            <span className="font-mono text-helios-text">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TriggerDebugIsland({ kunden, selectedUserId, triggerData }: Props) {
  const router = useRouter()

  function onUserChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    if (id) {
      router.push(`/helios/trigger-debug?userId=${id}`)
    } else {
      router.push('/helios/trigger-debug')
    }
  }

  return (
    <div className="px-8 py-6 space-y-6">
      {/* User-Auswahl */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-helios-text whitespace-nowrap">Kunde wählen:</label>
        <select
          value={selectedUserId ?? ''}
          onChange={onUserChange}
          className="flex-1 max-w-sm rounded-lg border border-helios-border bg-helios-surface text-helios-text text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-helios-accent/30"
        >
          <option value="">— Bitte wählen —</option>
          {kunden.map((k) => (
            <option key={k.id} value={k.id}>
              {k.vorname ?? '(kein Name)'} · {k.email} [{k.paketTier ?? '?'}]
            </option>
          ))}
        </select>
      </div>

      {/* Ergebnisse */}
      {triggerData && (
        <div className="space-y-6">
          <CtxSummaryCard summary={triggerData.ctxSummary} />

          <div>
            <p className="text-xs font-semibold text-helios-text-subtle uppercase tracking-widest mb-3">
              Aktive Signale ({triggerData.signals.length})
            </p>

            {triggerData.signals.length === 0 ? (
              <div className="rounded-xl border border-helios-border bg-helios-surface p-6 text-center">
                <span className="text-2xl">✓</span>
                <p className="mt-2 text-sm text-helios-text-muted">Keine aktiven Trigger</p>
              </div>
            ) : (
              <div className="space-y-3">
                {triggerData.signals.map((signal) => (
                  <SignalCard
                    key={signal.signal_typ}
                    signal={signal}
                    highlight={signal.signal_typ === triggerData.primary?.signal_typ}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedUserId && (
        <p className="text-sm text-helios-text-subtle">Wähle einen Kunden um seine aktiven Trigger-Signale zu sehen.</p>
      )}
    </div>
  )
}
