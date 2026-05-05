'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2, AlertTriangle, RefreshCw, Lock } from 'lucide-react'
import { scoreInteressent } from '@/lib/ai/scoreInteressent'
import type { Tier } from '@/lib/tier'

interface Props {
  interessentId: string
  score: number | null
  ampel: string | null
  begruendung: string | null
  klaerungsfragen: string[]
  redFlags: string[]
  basisFelder: number | null
  aktualisiert: string | null
  canScore: boolean
  tier: Tier
  finanzierungSet: boolean
  zeithorizontSet: boolean
}

const AMPEL_STYLES = {
  gruen: { dot: 'bg-green-500', badge: 'bg-green-50 text-green-700', label: 'Grün — Hohe Seriosität' },
  gelb: { dot: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-700', label: 'Gelb — Mittlere Seriosität' },
  rot: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700', label: 'Rot — Niedrige Seriosität' },
}

export default function KiScoreCard({
  interessentId, score, ampel, begruendung, klaerungsfragen, redFlags,
  basisFelder, aktualisiert, canScore, tier, finanzierungSet, zeithorizontSet,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const isProOrHigher = tier === 'pro' || tier === 'premium'

  function handleScore() {
    if (score && !showConfirm) {
      setShowConfirm(true)
      return
    }
    setShowConfirm(false)
    setError(null)
    startTransition(async () => {
      const result = await scoreInteressent(interessentId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  if (!isProOrHigher) {
    return (
      <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-accent" />
          <h3 className="text-[14px] font-bold text-text-primary">KI-Vorqualifizierung</h3>
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Pro</span>
        </div>
        <div className="blur-sm pointer-events-none select-none">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-[22px] font-bold text-green-700">8</span>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-green-50 text-green-700">
                <span className="w-2 h-2 rounded-full bg-green-500" />Grün — Hohe Seriosität
              </span>
            </div>
          </div>
          <p className="text-[13px] text-text-secondary">Finanzierungsstatus solide, Zeithorizont passend…</p>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[1px]">
          <Lock size={20} className="text-text-secondary mb-2" />
          <p className="text-[13px] font-semibold text-text-primary mb-3">Pro-Feature</p>
          <a
            href="/#preise"
            className="px-4 py-2 rounded-pill bg-accent text-white text-[13px] font-semibold hover:bg-accent-hover transition-colors"
          >
            Upgrade auf Pro →
          </a>
        </div>
      </div>
    )
  }

  const missingFields: string[] = []
  if (!finanzierungSet) missingFields.push('Finanzierungsstatus')
  if (!zeithorizontSet) missingFields.push('Zeithorizont')

  return (
    <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-accent" />
        <h3 className="text-[14px] font-bold text-text-primary">KI-Vorqualifizierung</h3>
        {aktualisiert && (
          <span className="ml-auto text-[11px] text-text-tertiary">
            {new Date(aktualisiert).toLocaleDateString('de-DE')}
          </span>
        )}
      </div>

      {error && (
        <p className="text-[13px] text-[#C13515] bg-[#FDECEA] rounded-lg px-3 py-2">{error}</p>
      )}

      {score ? (
        <>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
              ampel === 'gruen' ? 'bg-green-50' : ampel === 'gelb' ? 'bg-yellow-50' : 'bg-red-50'
            }`}>
              <span className={`text-[22px] font-bold ${
                ampel === 'gruen' ? 'text-green-700' : ampel === 'gelb' ? 'text-yellow-700' : 'text-red-700'
              }`}>{score}</span>
            </div>
            <div>
              {ampel && AMPEL_STYLES[ampel as keyof typeof AMPEL_STYLES] && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold ${AMPEL_STYLES[ampel as keyof typeof AMPEL_STYLES].badge}`}>
                  <span className={`w-2 h-2 rounded-full ${AMPEL_STYLES[ampel as keyof typeof AMPEL_STYLES].dot}`} />
                  {AMPEL_STYLES[ampel as keyof typeof AMPEL_STYLES].label}
                </span>
              )}
              {basisFelder !== null && (
                <p className="text-[11px] text-text-tertiary mt-1">Basiert auf {basisFelder} von 9 möglichen Feldern</p>
              )}
            </div>
          </div>

          {begruendung && (
            <p className="text-[13px] text-text-secondary leading-relaxed">{begruendung}</p>
          )}

          {klaerungsfragen.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold text-text-primary mb-2">Klärungsfragen für das nächste Gespräch:</p>
              <ul className="space-y-1">
                {klaerungsfragen.map((q, i) => (
                  <li key={i} className="text-[13px] text-text-secondary flex items-start gap-2">
                    <span className="text-accent mt-0.5 flex-shrink-0">→</span>{q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {redFlags.length > 0 && (
            <div className="flex items-start gap-2 px-4 py-3 bg-[#FDECEA] border border-[#C13515]/20 rounded-xl">
              <AlertTriangle size={14} className="text-[#C13515] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[12px] font-semibold text-[#C13515] mb-1">Red Flags:</p>
                <ul className="space-y-0.5">
                  {redFlags.map((f, i) => (
                    <li key={i} className="text-[12px] text-[#C13515]">{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <p className="text-[11px] text-text-tertiary border-t border-[#EEEEEE] pt-3">
            KI-Einschätzung als Hilfsmittel. Die Entscheidung triffst du selbst.
          </p>

          {showConfirm ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 min-h-[40px] rounded-[8px] border border-[#DDDDDD] text-[13px] font-medium text-text-primary hover:bg-surface transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleScore}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-1.5 min-h-[40px] rounded-[8px] bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold transition-colors"
              >
                {isPending && <Loader2 size={12} className="animate-spin" />}
                Ja, neu generieren
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-1.5 text-[12px] font-medium text-text-secondary hover:text-accent transition-colors"
            >
              <RefreshCw size={12} />
              Score neu generieren
            </button>
          )}
        </>
      ) : (
        <>
          <p className="text-[13px] text-text-secondary">
            Die KI analysiert Finanzierung, Zeithorizont und Motivation — und gibt dir eine Einschätzung, wie ernsthaft dieser Interessent ist.
          </p>

          {missingFields.length > 0 ? (
            <div className="flex items-start gap-2 px-4 py-3 bg-surface border border-[#DDDDDD] rounded-xl">
              <AlertTriangle size={14} className="text-warning mt-0.5 flex-shrink-0" />
              <p className="text-[12px] text-text-secondary">
                Für eine sinnvolle Einschätzung bitte mindestens {missingFields.join(' und ')} ausfüllen.
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleScore}
            disabled={!canScore || isPending}
            title={!canScore ? `Bitte zuerst ${missingFields.join(' und ')} ausfüllen und speichern.` : undefined}
            className="flex items-center gap-2 px-5 min-h-[44px] rounded-[8px] bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-semibold transition-colors"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            KI-Score holen
          </button>
        </>
      )}
    </div>
  )
}
