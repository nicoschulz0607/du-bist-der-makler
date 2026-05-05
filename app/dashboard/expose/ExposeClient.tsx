'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Copy, Check, Home, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { ExposeOutput } from '@/lib/claude/expose'
import InlineButton from '@/components/klara/InlineButton'

interface ListingData {
  objekttyp: string | null
  adresse_strasse: string | null
  adresse_plz: string | null
  adresse_ort: string | null
  wohnflaeche_qm: number | null
  zimmer: number | null
  preis: number | null
  expose_html: string | null
  expose_generiert_at: string | null
}

interface ExposeClientProps {
  listing: ListingData | null
}

function parseExpose(html: string | null): ExposeOutput | null {
  if (!html) return null
  try {
    return JSON.parse(html) as ExposeOutput
  } catch {
    return null
  }
}

function CopyButton({ text, label = 'Kopieren' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard not available
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1 text-[12px] font-semibold text-text-secondary hover:text-accent transition-colors duration-100"
    >
      {copied ? (
        <><Check size={13} className="text-accent" /> Kopiert</>
      ) : (
        <><Copy size={13} /> {label}</>
      )}
    </button>
  )
}

const inputBase =
  'w-full rounded-[8px] border border-[#DDDDDD] px-4 py-3 text-[14px] font-medium text-text-primary bg-white outline-none transition-all duration-200 placeholder:text-text-tertiary focus:ring-2 focus:ring-accent focus:border-transparent resize-vertical'

const labelBase = 'block text-[13px] font-semibold text-text-primary mb-1.5'

export default function ExposeClient({ listing }: ExposeClientProps) {
  const [wasIstBesonders, setWasIstBesonders] = useState('')
  const [idealeKaeufer, setIdealeKaeufer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expose, setExpose] = useState<ExposeOutput | null>(() => parseExpose(listing?.expose_html ?? null))
  const [generatedAt, setGeneratedAt] = useState<string | null>(listing?.expose_generiert_at ?? null)

  // --- State A: kein Listing ---
  if (!listing) {
    return (
      <div className="bg-white border border-[#DDDDDD] rounded-xl p-10 flex flex-col items-center text-center">
        <Home size={40} className="text-[#DDDDDD] mb-4" strokeWidth={1.5} />
        <p className="text-[15px] font-semibold text-text-primary mb-1">Noch kein Objekt angelegt</p>
        <p className="text-[13px] text-text-secondary mb-5">
          Lege zuerst dein Objekt an — der KI-Generator braucht deine Immobiliendaten als Basis.
        </p>
        <Link
          href="/dashboard/objekt"
          className="inline-flex items-center gap-2 rounded-pill bg-accent hover:bg-accent-hover text-white text-[14px] font-semibold px-5 h-10 transition-colors duration-150"
        >
          Objekt anlegen
        </Link>
      </div>
    )
  }

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/claude/expose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wasIstBesonders, idealeKaeufer }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Etwas hat nicht geklappt. Bitte versuche es erneut.')
        return
      }
      setExpose(data.expose)
      setGeneratedAt(new Date().toISOString())
    } catch {
      setError('Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung.')
    } finally {
      setLoading(false)
    }
  }

  const listingLabel = [
    listing.objekttyp,
    listing.adresse_strasse,
    listing.adresse_plz && listing.adresse_ort
      ? `${listing.adresse_plz} ${listing.adresse_ort}`
      : listing.adresse_ort,
  ]
    .filter(Boolean)
    .join(' · ')

  const allText = expose
    ? [
        expose.titel,
        expose.tagline,
        '',
        expose.beschreibung_kurz,
        '',
        expose.beschreibung_lang,
        '',
        expose.ausstattung_text,
        '',
        expose.lage_text,
      ].join('\n')
    : ''

  return (
    <div className="space-y-5">
      {/* Listing-Zusammenfassung */}
      <div className="bg-surface border border-[#EEEEEE] rounded-xl px-5 py-3.5 flex items-center gap-3">
        <Home size={16} className="text-text-secondary flex-shrink-0" strokeWidth={1.75} />
        <p className="text-[13px] font-medium text-text-secondary truncate">
          {listingLabel || 'Dein Objekt'}
        </p>
        {listing.preis && (
          <span className="ml-auto flex-shrink-0 text-[13px] font-bold text-accent">
            {listing.preis.toLocaleString('de-DE')} €
          </span>
        )}
      </div>

      {/* Freitext-Eingaben */}
      <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 space-y-5">
        <div>
          <p className="text-[15px] font-bold text-text-primary mb-0.5" style={{ letterSpacing: '-0.18px' }}>
            Kontext für die KI
          </p>
          <p className="text-[13px] text-text-secondary">
            Je mehr du erzählst, desto persönlicher und überzeugender wird das Exposé.
          </p>
        </div>

        <div>
          <label className={labelBase}>Was ist besonders an deiner Immobilie?</label>
          <textarea
            className={inputBase}
            rows={3}
            placeholder="z.B. neu renovierte Küche, ruhige Südlage, toller Garten, Fußbodenheizung..."
            value={wasIstBesonders}
            onChange={(e) => setWasIstBesonders(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label className={labelBase}>Wer ist der ideale Käufer?</label>
          <textarea
            className={inputBase}
            rows={3}
            placeholder="z.B. Familie mit Kindern, die ein ruhiges Umfeld suchen und Wert auf gute Schulen legen..."
            value={idealeKaeufer}
            onChange={(e) => setIdealeKaeufer(e.target.value)}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-[#FFF0F0] border border-[#FFCCCC] rounded-lg px-4 py-3">
            <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-[13px] text-red-600">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-pill bg-accent hover:bg-accent-hover text-white text-[14px] font-semibold px-6 h-11 transition-colors duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {loading ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              KI generiert deine Texte...
            </>
          ) : expose ? (
            <>
              <RefreshCw size={15} />
              Erneut generieren
            </>
          ) : (
            <>
              <Sparkles size={15} />
              Texte generieren
            </>
          )}
        </button>
        {loading && (
          <p className="text-[12px] text-text-tertiary">Das dauert etwa 15–20 Sekunden. Bitte warte kurz.</p>
        )}
      </div>

      {/* Ergebnis */}
      {expose && (
        <div className={`space-y-4 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          {generatedAt && (
            <p className="text-[12px] text-text-tertiary">
              Generiert am {new Date(generatedAt).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })} Uhr
            </p>
          )}

          {/* Titel + Tagline */}
          <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-1">
              <h2 className="text-[18px] font-bold text-text-primary flex-1" style={{ letterSpacing: '-0.18px' }}>
                {expose.titel}
              </h2>
              <CopyButton text={`${expose.titel}\n${expose.tagline}`} />
            </div>
            <p className="text-[14px] text-text-secondary italic">{expose.tagline}</p>
          </div>

          {/* Highlights */}
          <div className="bg-[#E8F5EE] border border-accent/20 rounded-xl p-5">
            <p className="text-[13px] font-bold text-accent uppercase tracking-wider mb-3">Highlights</p>
            <ul className="space-y-2">
              {expose.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent mt-0.5 flex-shrink-0" strokeWidth={2} />
                  <span className="text-[14px] font-medium text-text-primary">{h}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Kurzbeschreibung */}
          <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-bold text-text-primary uppercase tracking-wider">
                Kurzbeschreibung
              </p>
              <CopyButton text={expose.beschreibung_kurz} />
            </div>
            <p className="text-[14px] text-text-secondary leading-relaxed">{expose.beschreibung_kurz}</p>
          </div>

          {/* Vollständige Beschreibung */}
          <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-bold text-text-primary uppercase tracking-wider">
                Vollständige Beschreibung
              </p>
              <CopyButton text={expose.beschreibung_lang} />
            </div>
            <div className="space-y-3">
              {expose.beschreibung_lang.split('\n\n').map((para, i) => (
                <p key={i} className="text-[14px] text-text-secondary leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* Ausstattung + Lage side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-bold text-text-primary uppercase tracking-wider">Ausstattung</p>
                <CopyButton text={expose.ausstattung_text} />
              </div>
              <p className="text-[14px] text-text-secondary leading-relaxed">{expose.ausstattung_text}</p>
            </div>
            <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-bold text-text-primary uppercase tracking-wider">Lage</p>
                <CopyButton text={expose.lage_text} />
              </div>
              <p className="text-[14px] text-text-secondary leading-relaxed">{expose.lage_text}</p>
            </div>
          </div>

          {/* Alles kopieren + Klara */}
          <div className="flex items-center justify-between">
            <InlineButton
              prefilledQuestion="Kannst du meinen Exposé-Text sprachlich verbessern und überzeugender machen?"
              label="Klara um Stilverbesserung bitten"
            />
            <CopyButton text={allText} label="Alles kopieren" />
          </div>
        </div>
      )}
    </div>
  )
}
