'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, FileText, AlertCircle, CheckCircle2, Home, Images, Eye, Loader2 } from 'lucide-react'

interface PdfClientProps {
  listing: {
    objekttyp: string | null
    adresse_strasse: string | null
    adresse_plz: string | null
    adresse_ort: string | null
    wohnflaeche_qm: number | null
    zimmer: number | null
    preis: number | null
    fotos: string[]
    expose_html: string | null
    expose_generiert_at: string | null
  } | null
}

export default function PdfClient({ listing }: PdfClientProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/expose-pdf')
      if (!res.ok) throw new Error(`Fehler ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'expose.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('PDF konnte nicht erstellt werden. Bitte erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  if (!listing) {
    return (
      <div className="bg-white border border-[#DDDDDD] rounded-xl p-10 flex flex-col items-center text-center">
        <Home size={40} className="text-[#DDDDDD] mb-4" strokeWidth={1.5} />
        <p className="text-[15px] font-semibold text-text-primary mb-1">Noch kein Objekt angelegt</p>
        <p className="text-[13px] text-text-secondary mb-5">
          Lege zuerst dein Objekt an und generiere die Inserat-Texte.
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

  const hasExpose = !!listing.expose_html
  const fotoCount = listing.fotos.length
  const listingLabel = [
    listing.objekttyp,
    listing.adresse_plz && listing.adresse_ort
      ? `${listing.adresse_plz} ${listing.adresse_ort}`
      : listing.adresse_ort,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="space-y-5">
      {/* Objekt-Zusammenfassung */}
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

      {/* Checkliste */}
      <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 space-y-4">
        <p className="text-[15px] font-bold text-text-primary" style={{ letterSpacing: '-0.18px' }}>
          Was ins Exposé kommt
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {hasExpose ? (
              <CheckCircle2 size={16} className="text-accent flex-shrink-0" strokeWidth={2} />
            ) : (
              <AlertCircle size={16} className="text-[#C07000] flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={`text-[13px] font-semibold ${hasExpose ? 'text-text-primary' : 'text-[#C07000]'}`}>
                Inserat-Texte
              </p>
              {hasExpose ? (
                <p className="text-[12px] text-text-secondary">
                  Generiert am{' '}
                  {listing.expose_generiert_at
                    ? new Date(listing.expose_generiert_at).toLocaleDateString('de-DE')
                    : '—'}
                </p>
              ) : (
                <p className="text-[12px] text-[#C07000]">
                  Noch nicht generiert —{' '}
                  <Link href="/dashboard/expose" className="underline font-semibold">
                    Jetzt generieren →
                  </Link>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Images size={16} className={`flex-shrink-0 ${fotoCount > 0 ? 'text-accent' : 'text-text-tertiary'}`} strokeWidth={1.75} />
              <div>
                <p className="text-[13px] font-semibold text-text-primary">
                  Fotos{fotoCount > 0 ? ` (${fotoCount})` : ''}
                </p>
                <p className="text-[12px] text-text-secondary">
                  {fotoCount > 0
                    ? `${fotoCount} Foto${fotoCount === 1 ? '' : 's'} — werden auf alle Seiten verteilt`
                    : 'Keine Fotos — Exposé ohne Bilder'}
                </p>
              </div>
            </div>
            {fotoCount === 0 && (
              <Link
                href="/dashboard/objekt"
                className="flex-shrink-0 text-[12px] font-semibold text-accent hover:underline"
              >
                Fotos hochladen →
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <FileText size={16} className="text-text-tertiary flex-shrink-0" strokeWidth={1.75} />
            <div>
              <p className="text-[13px] font-semibold text-text-primary">Objektdaten</p>
              <p className="text-[12px] text-text-secondary">
                {[
                  listing.wohnflaeche_qm && `${listing.wohnflaeche_qm} m²`,
                  listing.zimmer && `${listing.zimmer} Zi.`,
                  listing.preis && `${listing.preis.toLocaleString('de-DE')} €`,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Eckdaten aus Mein Objekt'}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!hasExpose || loading}
            className="inline-flex items-center justify-center gap-2 rounded-pill bg-accent hover:bg-accent-hover text-white text-[14px] font-semibold px-6 h-11 transition-colors duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? <><Loader2 size={15} className="animate-spin" />Wird erstellt…</> : <><Download size={15} />PDF herunterladen</>}
          </button>

          {hasExpose && (
            <a
              href="/api/expose-preview"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-pill border border-[#DDDDDD] text-text-primary hover:border-[#BBBBBB] text-[14px] font-semibold px-5 h-11 transition-colors duration-150"
            >
              <Eye size={15} />
              Vorschau
            </a>
          )}
        </div>

        {!hasExpose && (
          <p className="text-[12px] text-text-tertiary">
            Du musst zuerst die{' '}
            <Link href="/dashboard/expose" className="text-accent font-semibold hover:underline">
              Inserat-Texte generieren
            </Link>
            , bevor das Exposé erstellt werden kann.
          </p>
        )}

        {hasExpose && (
          <p className="text-[12px] text-text-tertiary">
            PDF-Erstellung dauert ca. 10–15 Sekunden.
          </p>
        )}
      </div>
    </div>
  )
}
