'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'

const inputBase =
  'w-full rounded-[8px] border border-[#DDDDDD] px-4 min-h-[52px] text-[15px] font-medium text-text-primary bg-white outline-none transition-all duration-200 placeholder:text-text-tertiary focus:ring-2 focus:ring-accent focus:border-transparent'

const labelBase = 'block text-[13px] font-semibold text-text-primary mb-1.5'

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
}

interface ObjektFormProps {
  listing: ListingRow | null
  save: (formData: FormData) => Promise<void>
}

export default function ObjektForm({ listing, save }: ObjektFormProps) {
  const [isPending, startTransition] = useTransition()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setSaveStatus('idle')
    startTransition(async () => {
      try {
        await save(formData)
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {listing?.id && (
        <input type="hidden" name="listing_id" value={listing.id} />
      )}

      <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 space-y-5">
        <h2 className="text-[16px] font-bold text-text-primary" style={{ letterSpacing: '-0.18px' }}>
          Objekt-Grunddaten
        </h2>

        {/* Objekttyp */}
        <div>
          <label className={labelBase}>Objekttyp</label>
          <select name="objekttyp" className={inputBase} defaultValue={listing?.objekttyp ?? ''}>
            <option value="">Bitte wählen</option>
            <option value="Einfamilienhaus">Einfamilienhaus</option>
            <option value="Wohnung">Wohnung</option>
            <option value="Mehrfamilienhaus">Mehrfamilienhaus</option>
            <option value="Grundstück">Grundstück</option>
            <option value="Gewerbe">Gewerbe</option>
          </select>
        </div>

        {/* Adresse */}
        <div>
          <label className={labelBase}>Straße & Hausnummer</label>
          <input
            type="text"
            name="adresse_strasse"
            className={inputBase}
            placeholder="Musterstraße 1"
            defaultValue={listing?.adresse_strasse ?? ''}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>PLZ</label>
            <input
              type="text"
              name="adresse_plz"
              className={inputBase}
              placeholder="12345"
              defaultValue={listing?.adresse_plz ?? ''}
              maxLength={5}
            />
          </div>
          <div>
            <label className={labelBase}>Ort</label>
            <input
              type="text"
              name="adresse_ort"
              className={inputBase}
              placeholder="München"
              defaultValue={listing?.adresse_ort ?? ''}
            />
          </div>
        </div>

        {/* Eckdaten */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>Wohnfläche (m²)</label>
            <input
              type="number"
              name="wohnflaeche_qm"
              className={inputBase}
              placeholder="120"
              min={1}
              defaultValue={listing?.wohnflaeche_qm ?? ''}
            />
          </div>
          <div>
            <label className={labelBase}>Zimmer</label>
            <input
              type="number"
              name="zimmer"
              className={inputBase}
              placeholder="4"
              step="0.5"
              min={0.5}
              defaultValue={listing?.zimmer ?? ''}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>Baujahr</label>
            <input
              type="number"
              name="baujahr"
              className={inputBase}
              placeholder="1990"
              min={1800}
              max={new Date().getFullYear()}
              defaultValue={listing?.baujahr ?? ''}
            />
          </div>
          <div>
            <label className={labelBase}>Zustand</label>
            <select name="zustand" className={inputBase} defaultValue={listing?.zustand ?? ''}>
              <option value="">Bitte wählen</option>
              <option value="Neubau">Neubau</option>
              <option value="Modernisiert">Modernisiert</option>
              <option value="Gepflegt">Gepflegt</option>
              <option value="Renovierungsbedürftig">Renovierungsbedürftig</option>
            </select>
          </div>
        </div>

        {/* Preis */}
        <div>
          <label className={labelBase}>Verkaufspreis (€)</label>
          <input
            type="number"
            name="preis"
            className={inputBase}
            placeholder="450000"
            min={1}
            defaultValue={listing?.preis ?? ''}
          />
        </div>

        {/* Energieausweis */}
        <div>
          <label className={labelBase}>Energieausweis-Klasse</label>
          <select name="energieausweis_klasse" className={inputBase} defaultValue={listing?.energieausweis_klasse ?? ''}>
            <option value="">Bitte wählen / nicht vorhanden</option>
            {['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        {/* Beschreibung */}
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

        {/* Foto-Upload Platzhalter */}
        <div>
          <label className={labelBase}>Fotos (min. 5, max. 30)</label>
          <div className="border-2 border-dashed border-[#DDDDDD] rounded-[8px] p-8 flex flex-col items-center text-center">
            <p className="text-[14px] font-medium text-text-secondary">Foto-Upload kommt in Kürze</p>
            <p className="text-[12px] text-text-tertiary mt-1">JPEG / PNG, max. 10 MB pro Foto</p>
          </div>
        </div>

        {/* Feedback */}
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
