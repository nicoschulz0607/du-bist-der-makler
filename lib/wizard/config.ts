export type PhaseNumber = 1 | 2 | 3 | 4
export type StationLayout = 'focus' | 'wide' | 'split'
export type SidebarKind = 'context-help' | 'live-preview' | 'none'

export interface StationConfig {
  stationNum: number
  title: string
  subtitle: string
  phase: string
  phaseNum: PhaseNumber
  skipable: boolean
  klaraContext: string
  layout: StationLayout
  sidebarKind: SidebarKind
}

export const WIZARD_PHASES: Record<PhaseNumber, { label: string; range: [number, number] }> = {
  1: { label: 'Dein Objekt',      range: [1, 2] },
  2: { label: 'Pflichtangaben',   range: [3, 3] },
  3: { label: 'Inserat aufbauen', range: [4, 7] },
  4: { label: 'Live gehen',       range: [8, 9] },
}

export const WIZARD_STATIONS: StationConfig[] = [
  {
    stationNum: 1,
    title: 'Objekt-Grunddaten',
    subtitle: 'Adresse, Fläche, Zimmer — die Basis für alles weitere',
    phase: 'Dein Objekt',
    phaseNum: 1,
    skipable: false,
    klaraContext: 'wizard:station_grunddaten',
    layout: 'focus',
    sidebarKind: 'context-help',
  },
  {
    stationNum: 2,
    title: 'Marktwert & Lage',
    subtitle: 'Wir analysieren deine Immobilie und Umgebung',
    phase: 'Dein Objekt',
    phaseNum: 1,
    skipable: false,
    klaraContext: 'wizard:station_marktwert',
    layout: 'wide',
    sidebarKind: 'none',
  },
  {
    stationNum: 3,
    title: 'Energieausweis',
    subtitle: 'Pflicht beim Verkauf — drei Optionen',
    phase: 'Pflichtangaben',
    phaseNum: 2,
    skipable: true,
    klaraContext: 'wizard:station_energieausweis',
    layout: 'focus',
    sidebarKind: 'context-help',
  },
  {
    stationNum: 4,
    title: 'Fotos',
    subtitle: 'Deine Bilder — mit automatischer Qualitätsprüfung',
    phase: 'Inserat aufbauen',
    phaseNum: 3,
    skipable: false,
    klaraContext: 'wizard:station_fotos',
    layout: 'split',
    sidebarKind: 'live-preview',
  },
  {
    stationNum: 5,
    title: 'Grundriss',
    subtitle: 'Optional, aber empfohlen',
    phase: 'Inserat aufbauen',
    phaseNum: 3,
    skipable: true,
    klaraContext: 'wizard:station_grundriss',
    layout: 'focus',
    sidebarKind: 'context-help',
  },
  {
    stationNum: 6,
    title: 'Ausstattung',
    subtitle: 'Was deine Immobilie besonders macht',
    phase: 'Inserat aufbauen',
    phaseNum: 3,
    skipable: false,
    klaraContext: 'wizard:station_ausstattung',
    layout: 'wide',
    sidebarKind: 'none',
  },
  {
    stationNum: 7,
    title: 'Inserat-Texte',
    subtitle: 'KI schreibt — du polierst',
    phase: 'Inserat aufbauen',
    phaseNum: 3,
    skipable: false,
    klaraContext: 'wizard:station_texte',
    layout: 'split',
    sidebarKind: 'live-preview',
  },
  {
    stationNum: 8,
    title: 'Deine Kontaktdaten',
    subtitle: 'Für die Anfragen die jetzt kommen',
    phase: 'Live gehen',
    phaseNum: 4,
    skipable: false,
    klaraContext: 'wizard:station_kontakt',
    layout: 'focus',
    sidebarKind: 'live-preview',
  },
  {
    stationNum: 9,
    title: 'Vorschau & Veröffentlichen',
    subtitle: 'Letzter Blick — dann geht\'s live',
    phase: 'Live gehen',
    phaseNum: 4,
    skipable: false,
    klaraContext: 'wizard:station_live',
    layout: 'wide',
    sidebarKind: 'none',
  },
]

export function getPhaseForStation(stationNum: number): PhaseNumber {
  for (const [num, { range }] of Object.entries(WIZARD_PHASES) as [string, { label: string; range: [number, number] }][]) {
    if (stationNum >= range[0] && stationNum <= range[1]) {
      return parseInt(num) as PhaseNumber
    }
  }
  return 1
}
