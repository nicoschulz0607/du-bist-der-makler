'use client'

import { ImageIcon } from 'lucide-react'
import type { FotoItem } from '@/lib/foto'

interface Props {
  fotos: FotoItem[]
  objekttyp: string | null
  adresse_strasse: string | null
  adresse_plz: string | null
  adresse_ort: string | null
  adresse_im_expose: boolean
  wohnflaeche_qm: number | null
  zimmer: number | null
  baujahr: number | null
  preis: number | null
  titel: string | null
  beschreibung_kurz: string | null
  vorname?: string | null
  telefon?: string | null
  showContact?: boolean
}

function formatPrice(amount: number): string {
  return amount.toLocaleString('de-DE') + ' €'
}

export default function LiveInseratPreview(props: Props) {
  const titleFoto = props.fotos?.[0]
  const adresseAnzeige = props.adresse_im_expose
    ? [props.adresse_strasse, props.adresse_plz, props.adresse_ort].filter(Boolean).join(', ')
    : [props.adresse_plz, props.adresse_ort].filter(Boolean).join(' ') || 'Adresse folgt'

  const titleText = props.titel || (props.objekttyp && props.adresse_ort
    ? `${props.objekttyp} in ${props.adresse_ort}`
    : 'Dein Inserat')

  return (
    <div className="rounded-2xl border border-[#EEEEEE] bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[#EEEEEE] bg-[#FAFAFA] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#1B6B45] animate-pulse" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
          Live-Vorschau
        </span>
      </div>

      <div className="aspect-[16/10] bg-[#F5F5F5] relative">
        {titleFoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={titleFoto.url} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-text-tertiary text-[12px] gap-1.5">
            <ImageIcon size={20} />
            <span>Noch kein Titelbild</span>
          </div>
        )}
        {props.objekttyp && (
          <span className="absolute top-3 left-3 bg-white/95 text-text-primary text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {props.objekttyp}
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="text-[11px] text-text-tertiary mb-1">{adresseAnzeige}</p>
        <h3 className="text-[14px] font-bold text-text-primary leading-tight line-clamp-2 mb-2">
          {titleText}
        </h3>
        {props.preis ? (
          <p className="text-[18px] font-bold text-[#1B6B45] mb-3">{formatPrice(props.preis)}</p>
        ) : (
          <p className="text-[12px] text-text-tertiary mb-3">Preis wird ermittelt</p>
        )}

        {(props.wohnflaeche_qm || props.zimmer || props.baujahr) && (
          <div className="flex flex-wrap gap-3 text-[11px] text-text-secondary border-t border-[#F4F4F4] pt-3">
            {props.wohnflaeche_qm && (
              <span><strong className="text-text-primary">{props.wohnflaeche_qm}</strong> m²</span>
            )}
            {props.zimmer && (
              <span><strong className="text-text-primary">{props.zimmer}</strong> Zi.</span>
            )}
            {props.baujahr && (
              <span><strong className="text-text-primary">{props.baujahr}</strong></span>
            )}
          </div>
        )}

        {props.beschreibung_kurz && (
          <p className="text-[11px] text-text-secondary mt-3 line-clamp-3 leading-relaxed">
            {props.beschreibung_kurz}
          </p>
        )}

        {props.showContact && (props.vorname || props.telefon) && (
          <div className="mt-3 pt-3 border-t border-[#F4F4F4]">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Kontakt</p>
            {props.vorname && <p className="text-[12px] font-semibold text-text-primary">{props.vorname}</p>}
            {props.telefon && <p className="text-[11px] text-text-secondary">{props.telefon}</p>}
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-[#EEEEEE] bg-[#FAFAFA]">
        <p className="text-[10px] text-text-tertiary leading-relaxed">
          So wird dein Inserat ungefähr aussehen. Aktualisiert sich live während du Daten eingibst.
        </p>
      </div>
    </div>
  )
}
