'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  GraduationCap,
  ShoppingBag,
  Bus,
  Stethoscope,
  Trees,
  Check,
} from 'lucide-react'
import { analyseStarten, setAdresseImExpose as saveAdresseImExpose } from '@/lib/wizard/actions'
import type {
  MarktwertDaten,
  LageDaten,
  InfrastrukturItem,
  WertentwicklungsPunkt,
} from '@/lib/wizard/market-data-provider'

interface Props {
  listingId: string | null
  initialMarktwert: MarktwertDaten | null
  initialLage: LageDaten | null
  initialAdresseImExpose: boolean
  onCanAdvanceChange?: (can: boolean) => void
}

type AnalyseState = 'idle' | 'analyzing' | 'done' | 'error'

const LOADING_TEXTS = [
  'Analysiere Adresse und Geocoding...',
  'Lade Infrastruktur-Daten aus der Umgebung...',
  'Berechne Marktwert anhand vergleichbarer Verkäufe...',
  'Erstelle Wertentwicklungs-Prognose...',
  'Schätze Mietpotenzial...',
  'Fast fertig...',
]

function formatPrice(amount: number): string {
  return amount.toLocaleString('de-DE') + ' €'
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1).replace('.', ',')} km`
}

function formatRelativeDate(isoDate: string): string {
  const months = Math.round((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
  if (months <= 0) return 'Vor <1 Monat'
  if (months === 1) return 'Vor 1 Monat'
  return `Vor ${months} Mon.`
}

function calcGrowthPercent(data: WertentwicklungsPunkt[]): string {
  if (data.length < 2) return '0,0'
  const first = data[0].preis_pro_qm
  const last = data[data.length - 1].preis_pro_qm
  return ((last - first) / first * 100).toFixed(1).replace('.', ',')
}

function Sparkline({ data }: { data: WertentwicklungsPunkt[] }) {
  if (data.length < 2) return null
  const w = 600, h = 120, pad = 24
  const min = Math.min(...data.map(d => d.preis_pro_qm)) * 0.95
  const max = Math.max(...data.map(d => d.preis_pro_qm)) * 1.05
  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (w - 2 * pad)
    const y = h - pad - ((d.preis_pro_qm - min) / (max - min)) * (h - 2 * pad)
    return `${x},${y}`
  }).join(' ')
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B6B45" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1B6B45" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`${pad},${h - pad} ${points} ${w - pad},${h - pad}`}
          fill="url(#sparkfill)"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#1B6B45"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="flex justify-between mt-2 px-6 text-[11px] text-text-tertiary">
        {data.map(d => <span key={d.jahr}>{d.jahr}</span>)}
      </div>
    </div>
  )
}

function CategoryIcon({ kategorie }: { kategorie: InfrastrukturItem['kategorie'] }) {
  switch (kategorie) {
    case 'Bildung':    return <GraduationCap size={12} />
    case 'Versorgung': return <ShoppingBag size={12} />
    case 'Mobilität':  return <Bus size={12} />
    case 'Gesundheit': return <Stethoscope size={12} />
    case 'Freizeit':   return <Trees size={12} />
  }
}

export default function Station2MarktwertLage({
  listingId,
  initialMarktwert,
  initialLage,
  initialAdresseImExpose,
  onCanAdvanceChange,
}: Props) {
  const [analyseState, setAnalyseState] = useState<AnalyseState>(
    initialMarktwert && initialLage ? 'done' : 'idle'
  )
  const [marktwert, setMarktwert] = useState<MarktwertDaten | null>(initialMarktwert)
  const [lage, setLage] = useState<LageDaten | null>(initialLage)
  const [adresseImExpose, setAdresseImExpose] = useState(initialAdresseImExpose)
  const [adresseGespeichert, setAdresseGespeichert] = useState(false)
  const [loadingTextIndex, setLoadingTextIndex] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [, startAnalysisTransition] = useTransition()
  const [, startAdresseTransition] = useTransition()

  useEffect(() => {
    onCanAdvanceChange?.(analyseState === 'done')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyseState])

  useEffect(() => {
    if (analyseState !== 'analyzing') return
    const timer = setInterval(() => {
      setLoadingTextIndex(prev => Math.min(prev + 1, LOADING_TEXTS.length - 1))
    }, 1500)
    return () => clearInterval(timer)
  }, [analyseState])

  function startAnalyse() {
    if (!listingId || analyseState === 'analyzing') return
    const id = listingId
    setAnalyseState('analyzing')
    setLoadingTextIndex(0)
    setErrorMsg(null)

    startAnalysisTransition(async () => {
      const [result] = await Promise.all([
        analyseStarten(id),
        new Promise<void>(r => setTimeout(r, 6000)),
      ])

      if (result.success && result.marktwert && result.lage) {
        setMarktwert(result.marktwert)
        setLage(result.lage)
        setAnalyseState('done')
      } else {
        setErrorMsg(result.error ?? 'Analyse fehlgeschlagen — bitte erneut versuchen.')
        setAnalyseState('error')
      }
    })
  }

  function handleAdresseToggle(value: boolean) {
    setAdresseImExpose(value)
    setAdresseGespeichert(true)
    setTimeout(() => setAdresseGespeichert(false), 1500)
    startAdresseTransition(async () => {
      if (listingId) await saveAdresseImExpose(listingId, value)
    })
  }

  // ── Zustand A: idle ────────────────────────────────────────────────────────
  if (analyseState === 'idle') {
    return (
      <div className="max-w-[640px] mx-auto">
        <div className="rounded-2xl border border-[#EEEEEE] bg-gradient-to-br from-[#FAFAFA] to-white p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#E8F5EE] flex items-center justify-center mx-auto mb-5">
            <TrendingUp size={32} className="text-[#1B6B45]" />
          </div>
          <h3 className="text-[20px] font-bold text-text-primary mb-2">
            Bereit, deine Immobilie zu analysieren?
          </h3>
          <p className="text-[14px] text-text-secondary max-w-[420px] mx-auto leading-relaxed mb-7">
            Wir kombinieren öffentliche Daten, Marktanalysen und KI, um dir Marktwert,
            Lage und Vergleichsobjekte zu zeigen. Das dauert etwa 5 Sekunden.
          </p>
          {!listingId && (
            <p className="text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-6 max-w-[400px] mx-auto">
              Bitte zuerst die Grunddaten in Station 1 ausfüllen.
            </p>
          )}
          <button
            type="button"
            onClick={startAnalyse}
            disabled={!listingId}
            className="px-8 py-3 bg-[#1B6B45] text-white text-[15px] font-semibold rounded-xl hover:bg-[#165c3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-8"
          >
            Marktwert ermitteln
          </button>
          <ul className="text-[13px] text-text-secondary space-y-2 max-w-[300px] mx-auto text-left mb-7">
            {[
              'Marktwert mit Spanne und Begründung',
              'Vergleichsverkäufe in deiner Umgebung',
              'Wertentwicklung der letzten Jahre',
              'Mietpotenzial deiner Immobilie',
              'Lautstärke und Lage-Score',
              'Infrastruktur in der Nähe',
            ].map(text => (
              <li key={text} className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#1B6B45] shrink-0" />
                {text}
              </li>
            ))}
          </ul>
          <div className="inline-flex items-center gap-1.5 text-[11px] text-text-tertiary bg-surface px-3 py-1.5 rounded-full border border-[#EEEEEE]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B6B45]" />
            Datenbasis: KI-Analyse + öffentliche Daten. Marktdaten-Partner in Vorbereitung.
          </div>
        </div>
      </div>
    )
  }

  // ── Zustand B: analyzing ───────────────────────────────────────────────────
  if (analyseState === 'analyzing') {
    return (
      <div className="max-w-[640px] mx-auto">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="relative w-16 h-16 mb-7">
            <div className="absolute inset-0 rounded-full border-4 border-[#E8F5EE]" />
            <div className="absolute inset-0 rounded-full border-4 border-[#1B6B45] border-t-transparent animate-spin" />
          </div>
          <p className="text-[17px] font-semibold text-text-primary mb-2.5">Analyse läuft…</p>
          <p className="text-[14px] text-text-secondary min-h-[20px] transition-opacity duration-300">
            {LOADING_TEXTS[loadingTextIndex]}
          </p>
        </div>
      </div>
    )
  }

  // ── Zustand: error ─────────────────────────────────────────────────────────
  if (analyseState === 'error') {
    return (
      <div className="max-w-[640px] mx-auto">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-[16px] font-semibold text-red-700 mb-2">Analyse fehlgeschlagen</p>
          <p className="text-[14px] text-red-600 mb-5">{errorMsg}</p>
          <button
            type="button"
            onClick={startAnalyse}
            className="px-6 py-2.5 bg-[#1B6B45] text-white text-[14px] font-semibold rounded-lg hover:bg-[#165c3a] transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  // ── Zustand C: done ────────────────────────────────────────────────────────
  if (!marktwert || !lage) return null

  const grouped = lage.infrastruktur.reduce<Record<string, LageDaten['infrastruktur']>>(
    (acc, item) => {
      if (!acc[item.kategorie]) acc[item.kategorie] = []
      acc[item.kategorie].push(item)
      return acc
    },
    {},
  )

  return (
    <div className="space-y-6">
      {/* Hero — volle Breite */}
      <div className="rounded-2xl border-2 border-[#1B6B45]/20 bg-gradient-to-br from-[#F4FBF7] to-white p-10">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1B6B45] mb-4">
          Marktwert deiner Immobilie
        </p>
        <div className="flex items-baseline gap-3 mb-2">
          <h2
            className="text-[40px] md:text-[56px] font-bold text-text-primary leading-none"
            style={{ letterSpacing: '-1px' }}
          >
            {formatPrice(marktwert.mittelwert)}
          </h2>
          <span className="text-[15px] text-text-secondary font-medium">Mittelwert</span>
        </div>
        <p className="text-[15px] text-text-secondary mb-5">
          Spanne:{' '}
          <span className="font-semibold text-text-primary">
            {formatPrice(marktwert.spanne[0])} – {formatPrice(marktwert.spanne[1])}
          </span>
        </p>
        <p className="text-[14px] text-text-primary leading-relaxed bg-white/60 rounded-lg p-3 border border-[#1B6B45]/10">
          {marktwert.begruendung}
        </p>
      </div>

      {/* 2-Spalten-Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Linke Spalte */}
        <div className="space-y-6">
          {/* Positive Faktoren */}
          <div className="rounded-2xl border border-[#EEEEEE] bg-white p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1B6B45] mb-3 flex items-center gap-1.5">
              <TrendingUp size={12} /> Was den Wert hebt
            </p>
            <ul className="space-y-2">
              {marktwert.positive_faktoren.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-[14px] text-text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B6B45] mt-2 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Vergleichsverkäufe */}
          <div className="rounded-2xl border border-[#EEEEEE] bg-white p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-4">
              Vergleichsverkäufe in der Umgebung
            </p>
            <div className="space-y-0">
              {marktwert.vergleichsobjekte.map((v, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-4 py-3 border-b border-[#F4F4F4] last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-text-primary truncate">{v.titel}</p>
                    <p className="text-[12px] text-text-secondary mt-0.5">
                      {v.flaeche} m² · {v.zimmer ?? '?'} Zi. · {v.baujahr ?? '?'} · {formatDistance(v.entfernung_km)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[15px] font-bold text-text-primary">{formatPrice(v.preis)}</p>
                    <p className="text-[11px] text-text-tertiary mt-0.5">{formatRelativeDate(v.verkauft_am)}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[12px] text-text-tertiary mt-4">
              {marktwert.vergleichsobjekte.length} Vergleichsobjekte in einem Umkreis von 5 km gefunden
            </p>
          </div>

          {/* Mietpotenzial */}
          {marktwert.miete_pro_monat != null && (
            <div className="rounded-2xl border border-[#EEEEEE] bg-white p-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-3">
                Mietpotenzial deiner Immobilie
              </p>
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-[26px] font-bold text-text-primary">
                  {formatPrice(marktwert.miete_pro_monat)}
                </p>
                <span className="text-[14px] text-text-secondary">pro Monat</span>
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed">{marktwert.miete_erklaerung}</p>
              <p className="text-[11px] text-text-tertiary mt-3 italic">
                Diese Schätzung kann optional in dein Exposé aufgenommen werden — viele Käufer fragen danach.
              </p>
            </div>
          )}
        </div>

        {/* Rechte Spalte */}
        <div className="space-y-6">
          {/* Negative Faktoren */}
          <div className="rounded-2xl border border-[#EEEEEE] bg-white p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-1.5">
              <TrendingDown size={12} /> Was den Wert drückt
            </p>
            <ul className="space-y-2">
              {marktwert.negative_faktoren.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-[14px] text-text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary mt-2 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Wertentwicklung */}
          <div className="rounded-2xl border border-[#EEEEEE] bg-white p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                  Wertentwicklung deiner Region
                </p>
                <p className="text-[13px] text-text-secondary">€/m² über die letzten 5 Jahre</p>
              </div>
              <div className="text-right">
                <p className="text-[15px] font-bold text-[#1B6B45]">
                  +{calcGrowthPercent(marktwert.wertentwicklung)}%
                </p>
                <p className="text-[11px] text-text-tertiary">in 5 Jahren</p>
              </div>
            </div>
            <Sparkline data={marktwert.wertentwicklung} />
          </div>

          {/* Lage & Geräuschkulisse */}
          <div className="rounded-2xl border border-[#EEEEEE] bg-white p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-4">
              Lage & Geräuschkulisse
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[40px] font-bold text-[#1B6B45] leading-none">
                  {lage.lage_score}
                  <span className="text-[16px] text-text-tertiary font-medium">/10</span>
                </p>
                <p className="text-[12px] uppercase tracking-wider text-text-tertiary mt-1 mb-2">Lage-Score</p>
                <p className="text-[13px] text-text-primary">{lage.lage_beschreibung}</p>
              </div>
              <div>
                <p className="text-[40px] font-bold text-text-primary leading-none">
                  ~{lage.geraeusch_db}
                  <span className="text-[16px] text-text-tertiary font-medium"> dB</span>
                </p>
                <p className="text-[12px] uppercase tracking-wider text-text-tertiary mt-1 mb-2">Umgebungsgeräusche</p>
                <p className="text-[13px] text-text-primary">{lage.geraeusch_label}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Infrastruktur — volle Breite, 3 Spalten */}
      {Object.keys(grouped).length > 0 && (
        <div className="rounded-2xl border border-[#EEEEEE] bg-white p-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-4">
            Infrastruktur in der Nähe
          </p>
          <div className="grid md:grid-cols-3 gap-x-8 gap-y-5">
            {Object.entries(grouped).map(([kategorie, items]) => (
              <div key={kategorie}>
                <p className="text-[12px] font-semibold text-text-primary mb-2 flex items-center gap-2">
                  <CategoryIcon kategorie={kategorie as InfrastrukturItem['kategorie']} />
                  {kategorie}
                </p>
                <ul className="space-y-1.5">
                  {items.map((it, i) => (
                    <li key={i} className="flex items-center justify-between text-[13px]">
                      <span className="text-text-primary truncate pr-2">{it.name}</span>
                      <span className="text-text-tertiary shrink-0">{it.distanz}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adress-Toggle — volle Breite, Inhalt zentriert */}
      <div className="rounded-2xl border border-[#EEEEEE] bg-white p-6">
        <div className="max-w-[640px] mx-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
              Adresse im Exposé
            </p>
            {adresseGespeichert && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-[#1B6B45] animate-pulse">
                <Check size={12} /> Gespeichert
              </span>
            )}
          </div>
          <p className="text-[14px] text-text-primary mb-4 leading-relaxed">
            Soll deine genaue Hausnummer im veröffentlichten Inserat erscheinen, oder nur die Straße
            ohne Nummer?
          </p>
          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-3 p-3 rounded-lg border border-[#EEEEEE] cursor-pointer hover:bg-[#FAFAFA] transition-colors">
              <input
                type="radio"
                name="adresse_expose"
                checked={!adresseImExpose}
                onChange={() => handleAdresseToggle(false)}
                className="mt-1 accent-[#1B6B45]"
              />
              <div>
                <p className="text-[14px] font-medium text-text-primary">Nur Straße und Ort (empfohlen)</p>
                <p className="text-[12px] text-text-secondary mt-0.5">
                  Standard bei privaten Verkäufen — schützt vor unerwünschten Besuchen.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-lg border border-[#EEEEEE] cursor-pointer hover:bg-[#FAFAFA] transition-colors">
              <input
                type="radio"
                name="adresse_expose"
                checked={adresseImExpose}
                onChange={() => handleAdresseToggle(true)}
                className="mt-1 accent-[#1B6B45]"
              />
              <div>
                <p className="text-[14px] font-medium text-text-primary">Vollständige Adresse</p>
                <p className="text-[12px] text-text-secondary mt-0.5">
                  Wird interessierten Käufern erst nach Anfrage gezeigt — bei einigen Portalen auch
                  sofort.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[11px] text-text-tertiary text-center leading-relaxed max-w-md mx-auto pb-2">
        Datenbasis: KI-gestützte Analyse + öffentliche Daten (OpenStreetMap, regionale Marktdaten).
        Bei Live-Inseraten werden präzisere Vergleichsdaten unseres Marktdaten-Partners verwendet.
      </p>
    </div>
  )
}
