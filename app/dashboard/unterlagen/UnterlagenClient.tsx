'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import DokumentKarte, { DokumentMitStatus } from './DokumentKarte'
import DokumentDetailDrawer from './DokumentDetailDrawer'
import FortschrittsBalken from './FortschrittsBalken'

interface UnterlagenClientProps {
  basisDokumente: DokumentMitStatus[]
  spezifischeDokumente: DokumentMitStatus[]
  objekttypLabel: string | null
  pflichtVorhanden: number
  pflichtGesamt: number
}

export default function UnterlagenClient({
  basisDokumente,
  spezifischeDokumente,
  objekttypLabel,
  pflichtVorhanden,
  pflichtGesamt,
}: UnterlagenClientProps) {
  const [activeDokument, setActiveDokument] = useState<DokumentMitStatus | null>(null)

  return (
    <>
      {/* Fortschritt + Teilen-Button */}
      <div className="space-y-3">
        <FortschrittsBalken
          vorhandenCount={pflichtVorhanden}
          gesamtPflicht={pflichtGesamt}
        />
        <div className="flex justify-end">
          <button
            className="flex items-center gap-2 text-[13px] font-medium text-accent hover:text-accent/80 transition-colors"
            onClick={() => {/* TeilenDialog — Step 4 */}}
          >
            <Share2 size={14} strokeWidth={1.75} />
            Mappe mit Interessent teilen
          </button>
        </div>
      </div>

      {/* Basis-Dokumente */}
      <section>
        <h2 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Basis-Dokumente (für jeden Verkauf)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {basisDokumente.map((dok) => (
            <DokumentKarte
              key={dok.typ}
              dokument={dok}
              onClick={() => setActiveDokument(dok)}
            />
          ))}
        </div>
      </section>

      {/* Objekttyp-spezifische Dokumente */}
      {spezifischeDokumente.length > 0 && (
        <section>
          <h2 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-3">
            {objekttypLabel
              ? `Speziell für dein${objekttypLabel === 'Grundstück' ? '' : 'e'} ${objekttypLabel}`
              : 'Weitere Dokumente'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {spezifischeDokumente.map((dok) => (
              <DokumentKarte
                key={dok.typ}
                dokument={dok}
                onClick={() => setActiveDokument(dok)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {basisDokumente.length === 0 && spezifischeDokumente.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[14px] text-text-secondary">Keine Dokumente gefunden.</p>
        </div>
      )}

      {/* Detail-Drawer */}
      {activeDokument && (
        <DokumentDetailDrawer
          dokument={activeDokument}
          onClose={() => setActiveDokument(null)}
        />
      )}
    </>
  )
}
