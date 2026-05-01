'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import FotoUpload from '@/components/dashboard/FotoUpload'

const inputBase =
  'w-full rounded-[8px] border border-[#DDDDDD] px-4 min-h-[52px] text-[15px] font-medium text-text-primary bg-white outline-none transition-all duration-200 placeholder:text-text-tertiary focus:ring-2 focus:ring-accent focus:border-transparent'

const labelBase = 'block text-[13px] font-semibold text-text-primary mb-1.5'

const AUSSTATTUNG_OPTIONS = [
  'Garage', 'Carport', 'Keller', 'Dachgeschoss ausgebaut',
  'Balkon', 'Terrasse', 'Garten', 'Einbauküche',
  'Parkett', 'Fußbodenheizung', 'Rollläden', 'Fahrstuhl',
  'Barrierefrei', 'Pool', 'Sauna', 'Klimaanlage',
]

interface ListingRow {
  id: string
  objekttyp: string | null
  adresse_strasse: string | null
  adresse_plz: string | null
  adresse_ort: string | null
  wohnflaeche_qm: number | null
  zimmer: number | null
  baujahr: number | null
  zustand: string | null
  preis: number | null
  energieausweis_klasse: string | null
  beschreibung: string | null
  status: string | null
  fotos: string[] | null
  badezimmer: number | null
  schlafzimmer: number | null
  etage: string | null
  nutzflaeche_qm: number | null
  grundstueck_qm: number | null
  renovierungsjahr: number | null
  heizungsart: string | null
  energieausweis_typ: string | null
  energieverbrauch: number | null
  energietraeger: string | null
  ausstattung_items: string[] | null
}

interface ObjektFormProps {
  listing: ListingRow | null
  userId: string
  save: (formData: FormData) => Promise<{ listingId: string | null }>
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="border-t border-[#EEEEEE] pt-5 mt-1">
      <h3 className="text-[14px] font-bold text-text-primary mb-4">{title}</h3>
    </div>
  )
}

export default function ObjektForm({ listing, userId, save }: ObjektFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [fotos, setFotos] = useState<string[]>(listing?.fotos ?? [])
  const [ausstattungItems, setAusstattungItems] = useState<string[]>(listing?.ausstattung_items ?? [])

  function toggleAusstattung(item: string) {
    setAusstattungItems(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('fotos', JSON.stringify(fotos))
    formData.set('ausstattung_items', JSON.stringify(ausstattungItems))
    setSaveStatus('idle')
    startTransition(async () => {
      try {
        const result = await save(formData)
        setSaveStatus('saved')
        router.refresh()
        // Fire-and-forget: refresh geo+infra in background via dedicated route (maxDuration=30)
        const idToRefresh = result?.listingId ?? listing?.id
        if (idToRefresh) {
          fetch('/api/refresh-geo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listing_id: idToRefresh }),
          }).catch(() => {})
        }
      } catch {
        setSaveStatus('error')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {listing?.id && <input type="hidden" name="listing_id" value={listing.id} />}

      <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 space-y-5">

        {/* ── Grunddaten ── */}
        <h2 className="text-[16px] font-bold text-text-primary" style={{ letterSpacing: '-0.18px' }}>
          Objekt-Grunddaten
        </h2>

        <div>
          <label className={labelBase}>Objekttyp</label>
          <select name="objekttyp" className={inputBase} defaultValue={listing?.objekttyp ?? ''}>
            <option value="">Bitte wählen</option>
            <option>Einfamilienhaus</option>
            <option>Doppelhaushälfte</option>
            <option>Reihenhaus</option>
            <option>Wohnung</option>
            <option>Mehrfamilienhaus</option>
            <option>Grundstück</option>
            <option>Gewerbe</option>
          </select>
        </div>

        <div>
          <label className={labelBase}>Straße & Hausnummer</label>
          <input type="text" name="adresse_strasse" className={inputBase} placeholder="Musterstraße 1" defaultValue={listing?.adresse_strasse ?? ''} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>PLZ</label>
            <input type="text" name="adresse_plz" className={inputBase} placeholder="12345" defaultValue={listing?.adresse_plz ?? ''} maxLength={5} />
          </div>
          <div>
            <label className={labelBase}>Ort</label>
            <input type="text" name="adresse_ort" className={inputBase} placeholder="München" defaultValue={listing?.adresse_ort ?? ''} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>Wohnfläche (m²)</label>
            <input type="number" name="wohnflaeche_qm" className={inputBase} placeholder="120" min={1} defaultValue={listing?.wohnflaeche_qm ?? ''} />
          </div>
          <div>
            <label className={labelBase}>Zimmer</label>
            <input type="number" name="zimmer" className={inputBase} placeholder="4" step="0.5" min={0.5} defaultValue={listing?.zimmer ?? ''} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>Baujahr</label>
            <input type="number" name="baujahr" className={inputBase} placeholder="1990" min={1800} max={new Date().getFullYear()} defaultValue={listing?.baujahr ?? ''} />
          </div>
          <div>
            <label className={labelBase}>Zustand</label>
            <select name="zustand" className={inputBase} defaultValue={listing?.zustand ?? ''}>
              <option value="">Bitte wählen</option>
              <option>Neubau</option>
              <option>Modernisiert</option>
              <option>Gepflegt</option>
              <option>Renovierungsbedürftig</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelBase}>Verkaufspreis (€)</label>
          <input type="number" name="preis" className={inputBase} placeholder="450000" min={1} defaultValue={listing?.preis ?? ''} />
        </div>

        <div>
          <label className={labelBase}>Beschreibung</label>
          <textarea
            name="beschreibung"
            className="w-full rounded-[8px] border border-[#DDDDDD] px-4 py-3 text-[15px] font-medium text-text-primary bg-white outline-none transition-all duration-200 placeholder:text-text-tertiary focus:ring-2 focus:ring-accent focus:border-transparent min-h-[120px] resize-vertical"
            placeholder="Beschreibe deine Immobilie in 2–3 Sätzen..."
            maxLength={2000}
            defaultValue={listing?.beschreibung ?? ''}
          />
        </div>

        {/* ── Details ── */}
        <SectionDivider title="Details" />

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelBase}>Badezimmer</label>
            <input type="number" name="badezimmer" className={inputBase} placeholder="1" min={0} defaultValue={listing?.badezimmer ?? ''} />
          </div>
          <div>
            <label className={labelBase}>Schlafzimmer</label>
            <input type="number" name="schlafzimmer" className={inputBase} placeholder="3" min={0} defaultValue={listing?.schlafzimmer ?? ''} />
          </div>
          <div>
            <label className={labelBase}>Etage</label>
            <input type="text" name="etage" className={inputBase} placeholder="EG / 1. OG" defaultValue={listing?.etage ?? ''} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelBase}>Nutzfläche (m²)</label>
            <input type="number" name="nutzflaeche_qm" className={inputBase} placeholder="40" min={0} defaultValue={listing?.nutzflaeche_qm ?? ''} />
          </div>
          <div>
            <label className={labelBase}>Grundstück (m²)</label>
            <input type="number" name="grundstueck_qm" className={inputBase} placeholder="500" min={0} defaultValue={listing?.grundstueck_qm ?? ''} />
          </div>
          <div>
            <label className={labelBase}>Renovierungsjahr</label>
            <input type="number" name="renovierungsjahr" className={inputBase} placeholder="2018" min={1900} max={new Date().getFullYear()} defaultValue={listing?.renovierungsjahr ?? ''} />
          </div>
        </div>

        <div>
          <label className={labelBase}>Ausstattung</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {AUSSTATTUNG_OPTIONS.map((option) => {
              const checked = ausstattungItems.includes(option)
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleAusstattung(option)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-[6px] border transition-colors select-none text-left ${
                    checked ? 'bg-[#E8F5EE] border-accent' : 'bg-white border-[#DDDDDD] hover:border-[#AAAAAA]'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-[3px] flex-shrink-0 flex items-center justify-center border transition-colors ${checked ? 'bg-accent border-accent' : 'border-[#CCCCCC]'}`}>
                    {checked && (
                      <svg viewBox="0 0 10 8" width="10" height="8" fill="none">
                        <path d="M1 4l2.5 3L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className={`text-[12px] font-medium ${checked ? 'text-accent' : 'text-text-secondary'}`}>{option}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Energie & Heizung ── */}
        <SectionDivider title="Energie & Heizung" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>Energieausweis-Klasse</label>
            <select name="energieausweis_klasse" className={inputBase} defaultValue={listing?.energieausweis_klasse ?? ''}>
              <option value="">Nicht vorhanden</option>
              {['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelBase}>Ausweis-Typ</label>
            <select name="energieausweis_typ" className={inputBase} defaultValue={listing?.energieausweis_typ ?? ''}>
              <option value="">Bitte wählen</option>
              <option>Verbrauchsausweis</option>
              <option>Bedarfsausweis</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>Heizungsart</label>
            <select name="heizungsart" className={inputBase} defaultValue={listing?.heizungsart ?? ''}>
              <option value="">Bitte wählen</option>
              <option>Gas-Zentralheizung</option>
              <option>Öl-Zentralheizung</option>
              <option>Wärmepumpe (Luft)</option>
              <option>Wärmepumpe (Erdwärme)</option>
              <option>Fernwärme</option>
              <option>Pellets / Holz</option>
              <option>Elektro</option>
              <option>Solar / Photovoltaik</option>
            </select>
          </div>
          <div>
            <label className={labelBase}>Energieträger</label>
            <input type="text" name="energietraeger" className={inputBase} placeholder="Erdgas" defaultValue={listing?.energietraeger ?? ''} />
          </div>
        </div>

        <div>
          <label className={labelBase}>Energieverbrauch (kWh/m²a)</label>
          <input type="number" name="energieverbrauch" className={inputBase} placeholder="95" min={0} step="0.1" defaultValue={listing?.energieverbrauch ?? ''} />
        </div>

        {/* ── Fotos ── */}
        <SectionDivider title="Fotos — erstes Foto wird Titelbild" />

        <FotoUpload
          userId={userId}
          listingId={listing?.id ?? null}
          initialFotos={listing?.fotos ?? []}
          onChange={setFotos}
        />

        {/* Feedback & Submit */}
        {saveStatus === 'saved' && (
          <div className="flex items-center gap-2 bg-[#E8F5EE] border border-accent/20 rounded-lg px-4 py-3">
            <CheckCircle2 size={16} className="text-accent flex-shrink-0" strokeWidth={2} />
            <p className="text-[13px] font-medium text-accent">
              {listing?.id ? 'Änderungen gespeichert.' : 'Objekt angelegt.'}
            </p>
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="flex items-center gap-2 bg-[#FFF0F0] border border-[#FFCCCC] rounded-lg px-4 py-3">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
            <p className="text-[13px] text-red-600">Speichern fehlgeschlagen. Bitte versuche es erneut.</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full inline-flex items-center justify-center rounded-pill bg-accent hover:bg-accent-hover text-white text-[15px] font-semibold px-6 min-h-[52px] transition-colors duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isPending ? 'Wird gespeichert...' : listing?.id ? 'Änderungen speichern' : 'Objekt anlegen'}
        </button>
      </div>
    </form>
  )
}
