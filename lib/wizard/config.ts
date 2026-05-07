export type PhaseNumber = 1 | 2 | 3 | 4

export interface StationConfig {
  stationNum: number
  title: string
  subtitle: string
  phase: string
  phaseNum: PhaseNumber
  skipable: boolean
  klaraContext: string
}

export const WIZARD_PHASES: Record<PhaseNumber, { label: string; range: [number, number] }> = {
  1: { label: 'Vorbereitung', range: [1, 3] },
  2: { label: 'Bewertung & Daten', range: [4, 6] },
  3: { label: 'Inserat aufbauen', range: [7, 10] },
  4: { label: 'Live gehen', range: [11, 12] },
}

export const WIZARD_STATIONS: StationConfig[] = [
  {
    stationNum: 1,
    title: 'Willkommen & Standortbestimmung',
    subtitle: '3 kurze Fragen zur Orientierung',
    phase: 'Vorbereitung',
    phaseNum: 1,
    skipable: false,
    klaraContext: 'wizard:station_1_willkommen',
  },
  {
    stationNum: 2,
    title: 'Persönliche Eckdaten',
    subtitle: 'Deine Kontaktdaten für das Inserat',
    phase: 'Vorbereitung',
    phaseNum: 1,
    skipable: false,
    klaraContext: 'wizard:station_2_eckdaten',
  },
  {
    stationNum: 3,
    title: 'Objekt-Grunddaten',
    subtitle: 'Adresse, Fläche, Zimmer und mehr',
    phase: 'Vorbereitung',
    phaseNum: 1,
    skipable: false,
    klaraContext: 'wizard:station_3_grunddaten',
  },
  {
    stationNum: 4,
    title: 'Lage & Umgebung',
    subtitle: 'Infrastruktur und Lagebewertung',
    phase: 'Bewertung & Daten',
    phaseNum: 2,
    skipable: false,
    klaraContext: 'wizard:station_4_lage',
  },
  {
    stationNum: 5,
    title: 'Marktwert ermitteln',
    subtitle: 'KI-gestützte Preisschätzung',
    phase: 'Bewertung & Daten',
    phaseNum: 2,
    skipable: true,
    klaraContext: 'wizard:station_5_marktwert',
  },
  {
    stationNum: 6,
    title: 'Energieausweis',
    subtitle: 'Hochladen, bestellen oder nachreichen',
    phase: 'Bewertung & Daten',
    phaseNum: 2,
    skipable: true,
    klaraContext: 'wizard:station_6_energieausweis',
  },
  {
    stationNum: 7,
    title: 'Fotos hochladen',
    subtitle: 'Mindestens 1 Foto, ideal 8–15',
    phase: 'Inserat aufbauen',
    phaseNum: 3,
    skipable: false,
    klaraContext: 'wizard:station_7_fotos',
  },
  {
    stationNum: 8,
    title: 'Grundriss',
    subtitle: 'Optional, aber empfohlen',
    phase: 'Inserat aufbauen',
    phaseNum: 3,
    skipable: true,
    klaraContext: 'wizard:station_8_grundriss',
  },
  {
    stationNum: 9,
    title: 'Ausstattung & Beschreibung',
    subtitle: 'Merkmale und optionaler Freitext',
    phase: 'Inserat aufbauen',
    phaseNum: 3,
    skipable: false,
    klaraContext: 'wizard:station_9_ausstattung',
  },
  {
    stationNum: 10,
    title: 'Inserat-Texte generieren',
    subtitle: 'KI erstellt Titel, Beschreibung und Highlights',
    phase: 'Inserat aufbauen',
    phaseNum: 3,
    skipable: false,
    klaraContext: 'wizard:station_10_texte',
  },
  {
    stationNum: 11,
    title: 'Vorschau & Rechtscheck',
    subtitle: 'Letzter Blick vor der Veröffentlichung',
    phase: 'Live gehen',
    phaseNum: 4,
    skipable: false,
    klaraContext: 'wizard:station_11_vorschau',
  },
  {
    stationNum: 12,
    title: 'Veröffentlichen',
    subtitle: 'Dein Inserat geht live',
    phase: 'Live gehen',
    phaseNum: 4,
    skipable: false,
    klaraContext: 'wizard:station_12_veroeffentlichen',
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
