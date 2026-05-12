'use client'

import { useState, useTransition } from 'react'
import { XCircle, Eye } from 'lucide-react'
import { zurueckziehenMappeShare } from './actions'

interface Share {
  id: string
  empfaenger_name: string
  empfaenger_email: string | null
  ablaufdatum: string
  abgerufen_am: string[]
  zurueckgezogen_am: string | null
  share_token: string
  created_at: string
}

interface TeilenMappeListeProps {
  shares: Share[]
  appUrl: string
}

export default function TeilenMappeListe({ shares, appUrl }: TeilenMappeListeProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const aktive = shares.filter((s) => !s.zurueckgezogen_am && new Date(s.ablaufdatum) > new Date())
  const abgelaufen = shares.filter((s) => s.zurueckgezogen_am || new Date(s.ablaufdatum) <= new Date())

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function handleZurueckziehen(share_id: string) {
    startTransition(async () => {
      await zurueckziehenMappeShare(share_id)
      setConfirmId(null)
    })
  }

  if (shares.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
        Aktive Mappen
      </h2>

      <div className="space-y-2">
        {aktive.map((share) => (
          <div key={share.id} className="bg-white border border-[#EEEEEE] rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-text-primary">{share.empfaenger_name}</p>
                {share.empfaenger_email && (
                  <p className="text-[12px] text-text-secondary">{share.empfaenger_email}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-[11px] text-text-secondary">
                    Erstellt {formatDate(share.created_at)}
                  </span>
                  <span className="text-[11px] text-amber-600">
                    Läuft ab {formatDate(share.ablaufdatum)}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                    <Eye size={11} strokeWidth={1.75} />
                    {share.abgerufen_am.length}× abgerufen
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={`${appUrl}/mappe/${share.share_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-accent hover:underline"
                >
                  Link
                </a>
                {confirmId === share.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleZurueckziehen(share.id)}
                      disabled={isPending}
                      className="text-[11px] font-semibold text-red-600 hover:text-red-800"
                    >
                      Ja
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="text-[11px] text-text-secondary"
                    >
                      Nein
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(share.id)}
                    className="p-1 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                    title="Mappe zurückziehen"
                  >
                    <XCircle size={16} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {abgelaufen.length > 0 && (
        <details className="group">
          <summary className="text-[12px] text-text-secondary cursor-pointer hover:text-text-primary list-none flex items-center gap-1.5">
            <span className="transition-transform group-open:rotate-90">▶</span>
            {abgelaufen.length} abgelaufene/zurückgezogene Mappen
          </summary>
          <div className="mt-2 space-y-2">
            {abgelaufen.map((share) => (
              <div key={share.id} className="bg-gray-50 border border-[#EEEEEE] rounded-xl p-3 opacity-60">
                <p className="text-[12px] text-text-primary">{share.empfaenger_name}</p>
                <p className="text-[11px] text-text-secondary">
                  {share.zurueckgezogen_am ? 'Zurückgezogen' : 'Abgelaufen'} · {share.abgerufen_am.length}× abgerufen
                </p>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  )
}
