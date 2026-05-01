export interface FotoItem {
  url: string
  raumtyp?: string | null
  beschreibung?: string | null
  ki_konfidenz?: number | null
  raumtyp_manuell?: boolean
  analyse_status?: 'ausstehend' | 'analysiert' | 'fehler'
  merkmale?: string[] | null
  zustand?: string | null
  score?: number | null
}

export const RAUMTYPEN = [
  'Wohnzimmer', 'Küche', 'Schlafzimmer', 'Badezimmer', 'Gäste-WC',
  'Kinderzimmer', 'Arbeitszimmer', 'Esszimmer', 'Flur',
  'Keller', 'Dachboden', 'Garage', 'Carport',
  'Garten', 'Terrasse', 'Balkon', 'Außenansicht',
  'Grundriss', 'Sonstiges',
] as const

export type Raumtyp = typeof RAUMTYPEN[number]

export function normalizeFotos(raw: unknown): FotoItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(f => (typeof f === 'string' ? { url: f } : (f as FotoItem)))
    .filter(f => f?.url)
}
