// Provider-Adapter für Marktdaten. Erlaubt späteren Wechsel auf PriceHubble/Sprengnetter
// ohne Änderung an der UI-Schicht. Heute aktiv: FallbackProvider (Claude + OSM).

export interface VergleichsObjekt {
  titel: string
  preis: number
  flaeche: number
  entfernung_km: number
  verkauft_am: string
  baujahr?: number
  zimmer?: number
}

export interface WertentwicklungsPunkt {
  jahr: number
  preis_pro_qm: number
}

export interface InfrastrukturItem {
  kategorie: 'Bildung' | 'Versorgung' | 'Mobilität' | 'Gesundheit' | 'Freizeit'
  name: string
  distanz: string
}

export interface MarktwertDaten {
  wert: number
  spanne: [number, number]
  mittelwert: number
  begruendung: string
  positive_faktoren: string[]
  negative_faktoren: string[]
  vergleichsobjekte: VergleichsObjekt[]
  wertentwicklung: WertentwicklungsPunkt[]
  miete_pro_monat: number | null
  miete_erklaerung: string | null
  provider_name: 'fallback' | 'pricehubble' | 'sprengnetter'
  disclaimer: string
}

export interface LageDaten {
  lage_score: number
  lage_beschreibung: string
  geraeusch_db: number
  geraeusch_label: string
  infrastruktur: InfrastrukturItem[]
  provider_name: 'fallback' | 'pricehubble' | 'sprengnetter'
}

export interface MarketDataProvider {
  name: 'fallback' | 'pricehubble' | 'sprengnetter'
  analysiereImmobilie(listingId: string): Promise<{
    marktwert: MarktwertDaten
    lage: LageDaten
  } | null>
}

import { FallbackProvider } from './providers/fallback-provider'
// import { PricehubbleProvider } from './providers/pricehubble-provider'
// import { SprengnetterProvider } from './providers/sprengnetter-provider'

export function getActiveProvider(): MarketDataProvider {
  // TODO: switch on MARKET_DATA_PROVIDER env var when provider contracts are signed
  // if (process.env.MARKET_DATA_PROVIDER === 'pricehubble') return new PricehubbleProvider()
  // if (process.env.MARKET_DATA_PROVIDER === 'sprengnetter') return new SprengnetterProvider()
  return new FallbackProvider()
}
