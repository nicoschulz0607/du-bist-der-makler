'use client'

import { useState, useRef } from 'react'
import { saveAusstattung } from '@/lib/wizard/actions'

interface Props {
  listingId: string | null
  initialItems: string[]
  initialBeschreibung: string | null
  onCanAdvanceChange: (can: boolean) => void
}

const AUSSTATTUNG: Record<string, string[]> = {
  'Räume & Bereiche': ['Balkon', 'Terrasse', 'Garten', 'Loggia', 'Dachterrasse', 'Keller', 'Speicher', 'Wintergarten', 'Hobbyraum'],
  'Küche & Bad': ['Einbauküche', 'Gäste-WC', 'Tageslichtbad', 'Wanne', 'Dusche', 'Doppelwaschbecken'],
  'Komfort': ['Aufzug', 'Barrierefrei', 'Klimaanlage', 'Fußbodenheizung', 'Kamin'],
  'Außen & Parken': ['Garage', 'Tiefgaragenstellplatz', 'Außenstellplatz', 'Carport'],
  'Technik & Sicherheit': ['Alarmanlage', 'Smart Home', 'Glasfaser-Anschluss', 'Solaranlage', 'Wallbox'],
}

export default function Station6Ausstattung({
  listingId,
  initialItems,
  initialBeschreibung,
  onCanAdvanceChange: _onCanAdvanceChange,
}: Props) {
  const [selected, setSelected] = useState<string[]>(initialItems)
  const [beschreibung, setBeschreibung] = useState(initialBeschreibung ?? '')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleSave(items: string[], desc: string) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      if (!listingId) return
      saveAusstattung(listingId, { items, beschreibung: desc || null }).catch(console.error)
    }, 800)
  }

  function toggleItem(item: string) {
    setSelected((prev) => {
      const next = prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
      scheduleSave(next, beschreibung)
      return next
    })
  }

  function handleBeschreibungChange(val: string) {
    setBeschreibung(val)
    scheduleSave(selected, val)
  }

  function renderKategorie(kategorie: string) {
    const items = AUSSTATTUNG[kategorie]
    return (
      <div key={kategorie} className="rounded-2xl border border-[#EEEEEE] bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-3">
          {kategorie}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <label
              key={item}
              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                selected.includes(item)
                  ? 'border-[#1B6B45] bg-[#E8F5EE]'
                  : 'border-[#EEEEEE] hover:border-text-tertiary'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.includes(item)}
                onChange={() => toggleItem(item)}
                className="accent-[#1B6B45]"
              />
              <span className="text-[13px] text-text-primary">{item}</span>
            </label>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Spalte 1: Räume & Außen */}
        <div className="space-y-5">
          {renderKategorie('Räume & Bereiche')}
          {renderKategorie('Außen & Parken')}
        </div>

        {/* Spalte 2: Küche & Technik */}
        <div className="space-y-5">
          {renderKategorie('Küche & Bad')}
          {renderKategorie('Technik & Sicherheit')}
        </div>

        {/* Spalte 3: Komfort + Freitext */}
        <div className="space-y-5">
          {renderKategorie('Komfort')}
          <div className="rounded-2xl border border-[#EEEEEE] bg-white p-5">
            <label className="text-[13px] font-semibold text-text-primary block mb-2">
              Was macht deine Immobilie sonst noch besonders?{' '}
              <span className="font-normal text-text-tertiary">(optional)</span>
            </label>
            <textarea
              value={beschreibung}
              onChange={(e) => handleBeschreibungChange(e.target.value)}
              placeholder="z.B. frisch renoviert, besondere Aussicht, ruhige Seitenstraße …"
              rows={3}
              className="w-full border border-[#EEEEEE] rounded-xl px-4 py-3 text-[14px] text-text-primary resize-none focus:outline-none focus:border-[#1B6B45] placeholder:text-text-tertiary"
            />
            <p className="text-[11px] text-text-tertiary mt-1.5">
              Dieser Text fließt direkt in die KI-generierten Inserat-Texte ein.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
