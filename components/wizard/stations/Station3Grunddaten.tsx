'use client'

import { useEffect, useState, useTransition } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { saveStation3Listing } from '@/lib/wizard/actions'

interface InitialListingData {
  objekttyp: string | null
  adresse_strasse: string | null
  adresse_plz: string | null
  adresse_ort: string | null
  wohnflaeche_qm: number | null
  zimmer: number | null
  baujahr: number | null
}

interface Props {
  initialListing: InitialListingData | null
  listingId: string | null
  onCanAdvanceChange: (can: boolean) => void
  onListingCreated: (id: string) => void
}

const inputBase =
  'w-full rounded-[8px] border border-[#DDDDDD] px-4 min-h-[52px] text-[15px] font-medium text-text-primary bg-white outline-none transition-all duration-200 placeholder:text-text-tertiary focus:ring-2 focus:ring-accent focus:border-transparent'

const labelBase = 'block text-[13px] font-semibold text-text-primary mb-1.5'

const OBJEKTTYPEN = [
  'Wohnung',
  'Einfamilienhaus',
  'Doppelhaushälfte',
  'Reihenhaus',
  'Mehrfamilienhaus',
  'Grundstück',
  'Sonstiges',
]

export default function Station3Grunddaten({ initialListing, listingId, onCanAdvanceChange, onListingCreated }: Props) {
  const [form, setForm] = useState({
    objekttyp: initialListing?.objekttyp ?? '',
    adresse_strasse: initialListing?.adresse_strasse ?? '',
    adresse_plz: initialListing?.adresse_plz ?? '',
    adresse_ort: initialListing?.adresse_ort ?? '',
    wohnflaeche_qm: initialListing?.wohnflaeche_qm?.toString() ?? '',
    zimmer: initialListing?.zimmer?.toString() ?? '',
    baujahr: initialListing?.baujahr?.toString() ?? '',
  })
  const [, startTransition] = useTransition()

  const canAdvance = form.objekttyp.trim() !== '' && form.adresse_strasse.trim() !== ''

  useEffect(() => {
    onCanAdvanceChange(canAdvance)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAdvance])

  function saveAll() {
    startTransition(async () => {
      const result = await saveStation3Listing({
        objekttyp: form.objekttyp || undefined,
        adresse_strasse: form.adresse_strasse || undefined,
        adresse_plz: form.adresse_plz || undefined,
        adresse_ort: form.adresse_ort || undefined,
        wohnflaeche_qm: form.wohnflaeche_qm ? parseFloat(form.wohnflaeche_qm) : null,
        zimmer: form.zimmer ? parseFloat(form.zimmer) : null,
        baujahr: form.baujahr ? parseInt(form.baujahr) : null,
      })
      if (result.listingId && !listingId) {
        onListingCreated(result.listingId)
      }
    })
  }

  return (
    <div className="space-y-5">
      {listingId && (
        <div className="flex items-center gap-2 text-[13px] font-medium text-accent bg-[#E8F5EE] border border-accent/30 rounded-lg px-3 py-2">
          <CheckCircle2 size={14} className="flex-shrink-0" />
          Aus deinem Objekt übernommen
        </div>
      )}

      <div>
        <label className={labelBase}>Objekttyp <span className="text-[#C13515]">*</span></label>
        <select
          value={form.objekttyp}
          onChange={(e) => setForm((p) => ({ ...p, objekttyp: e.target.value }))}
          onBlur={saveAll}
          className={`${inputBase} cursor-pointer`}
        >
          <option value="">Bitte wählen …</option>
          {OBJEKTTYPEN.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelBase}>Straße & Hausnummer <span className="text-[#C13515]">*</span></label>
        <input
          type="text"
          value={form.adresse_strasse}
          onChange={(e) => setForm((p) => ({ ...p, adresse_strasse: e.target.value }))}
          onBlur={saveAll}
          placeholder="Musterstraße 12"
          className={inputBase}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelBase}>PLZ</label>
          <input
            type="text"
            value={form.adresse_plz}
            onChange={(e) => setForm((p) => ({ ...p, adresse_plz: e.target.value.slice(0, 5) }))}
            onBlur={saveAll}
            placeholder="10115"
            maxLength={5}
            className={inputBase}
          />
        </div>
        <div>
          <label className={labelBase}>Ort</label>
          <input
            type="text"
            value={form.adresse_ort}
            onChange={(e) => setForm((p) => ({ ...p, adresse_ort: e.target.value }))}
            onBlur={saveAll}
            placeholder="Berlin"
            className={inputBase}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelBase}>Wohnfläche (m²)</label>
          <input
            type="number"
            value={form.wohnflaeche_qm}
            onChange={(e) => setForm((p) => ({ ...p, wohnflaeche_qm: e.target.value }))}
            onBlur={saveAll}
            placeholder="95"
            min={1}
            className={inputBase}
          />
        </div>
        <div>
          <label className={labelBase}>Zimmer</label>
          <input
            type="number"
            value={form.zimmer}
            onChange={(e) => setForm((p) => ({ ...p, zimmer: e.target.value }))}
            onBlur={saveAll}
            placeholder="3.5"
            min={0.5}
            step={0.5}
            className={inputBase}
          />
        </div>
      </div>

      <div>
        <label className={labelBase}>Baujahr <span className="text-text-tertiary font-normal">(optional)</span></label>
        <input
          type="number"
          value={form.baujahr}
          onChange={(e) => setForm((p) => ({ ...p, baujahr: e.target.value }))}
          onBlur={saveAll}
          placeholder="z. B. 1985"
          min={1800}
          max={new Date().getFullYear()}
          className={inputBase}
        />
      </div>

      {!canAdvance && (
        <p className="text-[12px] text-text-tertiary">
          * Objekttyp und Straße sind Pflichtfelder, um fortzufahren.
        </p>
      )}
    </div>
  )
}
