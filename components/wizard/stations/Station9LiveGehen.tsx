'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, AlertCircle, Globe, Check, ExternalLink, FileText } from 'lucide-react'
import { veroeffentlicheListing } from '@/lib/wizard/actions'
import type { MarktwertDaten } from '@/lib/wizard/market-data-provider'
import type { FotoItem } from '@/lib/foto'
import type { ExposeOutput } from '@/lib/claude/expose'

interface Props {
  listingId: string | null
  objekttyp: string | null
  adresse_strasse: string | null
  adresse_plz: string | null
  adresse_ort: string | null
  adresse_im_expose: boolean
  wohnflaeche_qm: number | null
  zimmer: number | null
  baujahr: number | null
  marktwert_daten: MarktwertDaten | null
  energieausweis_klasse: string | null
  energieausweis_status: string | null
  fotos: FotoItem[]
  expose_html: string | null
  expose_edits: Record<string, unknown> | null
  ausstattung_items: string[]
  vorname: string | null
  telefon: string | null
  onCanAdvanceChange: (can: boolean) => void
}

type Zustand = 'vorschau' | 'veroeffentliche' | 'live'

const SCHRITTE = [
  { label: 'Inserat wird vorbereitet...', duration: 1500 },
  { label: 'Wird auf du-bist-der-makler.de veröffentlicht...', duration: 2000, portal: 'du-bist-der-makler.de' },
  { label: 'Wird an ImmoScout24 übermittelt...', duration: 2500, portal: 'ImmoScout24' },
  { label: 'Wird an eBay Kleinanzeigen übermittelt...', duration: 2000, portal: 'eBay Kleinanzeigen' },
  { label: 'Letzte Prüfungen werden durchgeführt...', duration: 1000 },
]

const TOTAL_DURATION = SCHRITTE.reduce((s, x) => s + x.duration, 0)

function mergeExpose(html: string | null, edits: Record<string, unknown> | null): ExposeOutput | null {
  if (!html) return null
  try {
    const base = JSON.parse(html) as ExposeOutput
    if (!edits) return base
    return { ...base, ...edits } as ExposeOutput
  } catch {
    return null
  }
}

function formatPrice(wert: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(wert)
}

export default function Station9LiveGehen({
  listingId,
  objekttyp,
  adresse_strasse,
  adresse_plz,
  adresse_ort,
  adresse_im_expose,
  wohnflaeche_qm,
  zimmer,
  baujahr,
  marktwert_daten,
  energieausweis_klasse,
  energieausweis_status,
  fotos,
  expose_html,
  expose_edits,
  ausstattung_items,
  vorname,
  telefon,
  onCanAdvanceChange,
}: Props) {
  const [zustand, setZustand] = useState<Zustand>('vorschau')
  const [slug, setSlug] = useState<string | null>(null)
  const [aktuellerSchritt, setAktuellerSchritt] = useState(SCHRITTE[0].label)
  const [erledigtePortale, setErledigtePortale] = useState<string[]>([])
  const [animationProgress, setAnimationProgress] = useState(0)

  const expose = mergeExpose(expose_html, expose_edits)
  const fotosCount = fotos.filter(f => f.url).length
  const erstesFoto = fotos.find(f => f.url)
  const nebenFotos = fotos.filter(f => f.url).slice(1)

  useEffect(() => {
    onCanAdvanceChange(false)
  }, [onCanAdvanceChange])

  const ort = [adresse_plz, adresse_ort].filter(Boolean).join(' ')
  const adresseAnzeige = adresse_im_expose && adresse_strasse
    ? `${adresse_strasse}, ${ort}`
    : ort || '—'

  const checks = [
    { id: 'grunddaten', label: 'Objektdaten vollständig', ok: !!(adresse_strasse && wohnflaeche_qm) },
    { id: 'marktwert', label: 'Marktwert analysiert', ok: !!marktwert_daten },
    { id: 'energieausweis', label: 'Energieausweis geklärt', ok: !!energieausweis_status },
    { id: 'fotos', label: `${fotosCount} Foto${fotosCount !== 1 ? 's' : ''} hochgeladen`, ok: fotosCount >= 1 },
    { id: 'ausstattung', label: 'Ausstattung erfasst', ok: ausstattung_items.length >= 1 },
    { id: 'texte', label: 'Inserat-Texte erstellt', ok: !!expose?.titel },
    { id: 'kontakt', label: 'Kontaktdaten hinterlegt', ok: !!(vorname && telefon) },
  ]

  const alleChecksOk = checks.every(c => c.ok)

  async function handleVeroeffentlichen() {
    if (!listingId) return
    setZustand('veroeffentliche')
    setErledigtePortale([])
    setAnimationProgress(0)

    let elapsed = 0
    const erledigte: string[] = []

    const animationPromise = (async () => {
      for (const schritt of SCHRITTE) {
        setAktuellerSchritt(schritt.label)
        await new Promise<void>(r => setTimeout(r, schritt.duration))
        elapsed += schritt.duration
        if (schritt.portal) {
          erledigte.push(schritt.portal)
          setErledigtePortale([...erledigte])
        }
        setAnimationProgress(Math.round((elapsed / TOTAL_DURATION) * 100))
      }
    })()

    const [, result] = await Promise.all([animationPromise, veroeffentlicheListing(listingId)])
    if (result.success && result.slug) setSlug(result.slug)
    setZustand('live')
  }

  if (zustand === 'veroeffentliche') {
    return (
      <div className="max-w-[640px] mx-auto">
        <div className="min-h-[400px] flex flex-col items-center justify-center px-6">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-accent-light"></div>
            <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin"></div>
          </div>
          <p className="text-[15px] font-medium text-text-primary mb-2 text-center min-h-[1.5em]">
            {aktuellerSchritt}
          </p>
          <p className="text-[12px] text-text-tertiary text-center">
            Bitte warte einen Moment — wir kümmern uns um alles.
          </p>
          <div className="w-64 h-1 bg-surface rounded-full mt-8 overflow-hidden">
            <div className="h-full bg-accent transition-all duration-500" style={{ width: `${animationProgress}%` }}></div>
          </div>
          {erledigtePortale.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-md">
              {erledigtePortale.map(p => (
                <span key={p} className="text-[11px] font-medium bg-accent-light text-accent px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Check size={11} /> {p}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (zustand === 'live') {
    return (
      <div className="max-w-[640px] mx-auto">
        <div className="max-w-lg mx-auto text-center py-8">
          <div className="w-20 h-20 rounded-full bg-accent-light flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={36} className="text-accent" strokeWidth={2.5} />
          </div>
          <h2 className="text-[28px] md:text-[32px] font-bold text-text-primary mb-2" style={{ letterSpacing: '-0.4px' }}>
            Dein Inserat ist live
          </h2>
          <p className="text-[15px] text-text-secondary mb-8 leading-relaxed">
            Glückwunsch! Ab jetzt können Interessenten dein Inserat sehen und Kontakt aufnehmen. Anfragen erscheinen automatisch in deinem CRM.
          </p>

          <div className="space-y-2.5 mb-8 text-left">
            <div className="flex items-center justify-between rounded-xl border border-[#EEEEEE] bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center">
                  <Globe size={16} className="text-accent" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-text-primary">du-bist-der-makler.de</p>
                  <p className="text-[12px] text-accent">Live</p>
                </div>
              </div>
              {slug && (
                <Link href={`/inserate/${slug}`} target="_blank" className="text-[13px] font-medium text-accent hover:underline">
                  Ansehen →
                </Link>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#EEEEEE] bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                  <Globe size={16} className="text-text-tertiary" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-text-primary">ImmoScout24</p>
                  <p className="text-[12px] text-amber-700">Wird in Kürze übermittelt</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#EEEEEE] bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                  <Globe size={16} className="text-text-tertiary" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-text-primary">eBay Kleinanzeigen</p>
                  <p className="text-[12px] text-amber-700">Wird in Kürze übermittelt</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {slug && (
              <Link
                href={`/inserate/${slug}`}
                target="_blank"
                className="inline-flex items-center justify-center gap-2 bg-accent text-white px-5 py-3 rounded-lg font-semibold hover:bg-accent-hover transition-colors"
              >
                Inserat ansehen <ExternalLink size={14} />
              </Link>
            )}
            <Link
              href="/dashboard/interessenten"
              className="inline-flex items-center justify-center gap-2 bg-white border border-[#DDDDDD] text-text-primary px-5 py-3 rounded-lg font-semibold hover:border-border-strong transition-colors"
            >
              Zum Interessenten-CRM
            </Link>
          </div>

          <p className="text-[12px] text-text-tertiary mt-8 leading-relaxed">
            Tipp: Teile dein Inserat über WhatsApp, E-Mail oder Social Media. Persönliche Empfehlungen sind die stärkste Conversion-Quelle.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-[1.3fr_1fr] gap-8 items-start">
      {/* Linke Spalte: Inserat-Vorschau */}
      <div>
        <div className="rounded-2xl border border-[#EEEEEE] bg-white overflow-hidden">
          <div className="aspect-[16/10] bg-surface relative">
            {erstesFoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={erstesFoto.url} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-tertiary text-[13px]">
                Kein Titelbild
              </div>
            )}
            <div className="absolute top-3 left-3 flex gap-2">
              {objekttyp && (
                <span className="bg-white/95 text-accent text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  {objekttyp}
                </span>
              )}
              {energieausweis_klasse && (
                <span className="bg-white/95 text-text-primary text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  Energie {energieausweis_klasse}
                </span>
              )}
            </div>
          </div>

          {nebenFotos.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5 p-3 border-t border-[#EEEEEE]">
              {nebenFotos.slice(0, 4).map((foto, i) => (
                <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-[#F0F0F0]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={foto.url} alt="" className="w-full h-full object-cover" />
                  {i === 3 && nebenFotos.length > 4 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-[11px] font-semibold">+{nebenFotos.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="p-5">
            <p className="text-[12px] font-medium text-text-secondary mb-1">{adresseAnzeige}</p>
            <h3 className="text-[18px] font-bold text-text-primary mb-2 leading-tight">
              {expose?.titel || <span className="text-text-tertiary italic font-normal">Kein Titel — bitte Texte generieren</span>}
            </h3>
            {marktwert_daten && (
              <p className="text-[22px] font-bold text-accent mb-3">{formatPrice(marktwert_daten.wert)}</p>
            )}
            <div className="flex gap-4 text-[13px] text-text-secondary border-t border-[#EEEEEE] pt-3">
              {wohnflaeche_qm != null && <span><strong className="text-text-primary">{wohnflaeche_qm}</strong> m²</span>}
              {zimmer != null && <span><strong className="text-text-primary">{zimmer}</strong> Zimmer</span>}
              <span><strong className="text-text-primary">{baujahr ?? '–'}</strong> Bj.</span>
            </div>
            {expose?.beschreibung_kurz && (
              <p className="text-[13px] text-text-secondary mt-3 line-clamp-3 leading-relaxed">
                {expose.beschreibung_kurz}
              </p>
            )}
            <div className="mt-4 pt-4 border-t border-[#F4F4F4]">
              <Link
                href="/dashboard/expose-pdf"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                <FileText size={13} /> Exposé als PDF ansehen
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Rechte Spalte: Checkliste + Live-Gehen + Info */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#EEEEEE] bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-3">
            Bereit zum Live-Gang
          </p>
          <ul className="space-y-2.5">
            {checks.map(check => (
              <li key={check.id} className="flex items-center gap-2 text-[13px]">
                {check.ok ? (
                  <CheckCircle2 size={16} className="text-accent shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-amber-500 shrink-0" />
                )}
                <span className={check.ok ? 'text-text-primary' : 'text-text-secondary'}>
                  {check.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={handleVeroeffentlichen}
          disabled={!alleChecksOk || !listingId}
          className="w-full bg-accent text-white text-[16px] font-bold py-4 rounded-xl hover:bg-accent-hover transition-colors disabled:bg-text-tertiary disabled:cursor-not-allowed"
        >
          Jetzt live gehen
        </button>

        <p className="text-[12px] text-text-tertiary text-center leading-relaxed">
          Dein Inserat wird auf du-bist-der-makler.de, ImmoScout24 und eBay Kleinanzeigen veröffentlicht.
        </p>

        <div className="rounded-xl border border-[#EEEEEE] bg-surface p-4">
          <p className="text-[12px] text-text-secondary leading-relaxed">
            <strong className="text-text-primary">Mit deinem Paket</strong> wird dein Inserat auf{' '}
            <strong className="text-text-primary">du-bist-der-makler.de</strong> veröffentlicht.
            Mit Premium auch automatisch auf ImmoScout24 und eBay Kleinanzeigen.
          </p>
        </div>

        <div className="rounded-2xl border border-[#EEEEEE] bg-surface p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-3">
            Was passiert nach dem Live-Gang?
          </p>
          <ol className="space-y-2.5 list-none">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-accent-light text-accent text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <span className="text-[13px] text-text-primary">Interessenten sehen dein Inserat und können direkt anfragen — du wirst per E-Mail benachrichtigt.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-accent-light text-accent text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <span className="text-[13px] text-text-primary">Alle Anfragen erscheinen in deinem Interessenten-CRM — mit Kontaktdaten und Status.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-accent-light text-accent text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
              <span className="text-[13px] text-text-primary">Du kannst das Inserat jederzeit bearbeiten, pausieren oder deaktivieren.</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
