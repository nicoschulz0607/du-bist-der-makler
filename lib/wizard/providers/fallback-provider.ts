import { createClient } from '@/lib/supabase/server'
import { geocodeAddress, fetchInfrastruktur, type InfraData } from '@/lib/infra'
import { claudeCreate } from '@/lib/ai/anthropic'
import type {
  MarketDataProvider,
  MarktwertDaten,
  LageDaten,
  InfrastrukturItem,
  VergleichsObjekt,
  WertentwicklungsPunkt,
} from '../market-data-provider'

interface ClaudeAnalysisResult {
  wert: number
  spanne_min: number
  spanne_max: number
  begruendung: string
  positive_faktoren: string[]
  negative_faktoren: string[]
  miete_pro_monat: number
  miete_erklaerung: string
  vergleichsobjekte: {
    titel: string
    preis: number
    flaeche: number
    entfernung_km: number
    verkauft_am: string
    baujahr: number
    zimmer: number
  }[]
  wertentwicklung: {
    jahr: number
    preis_pro_qm: number
  }[]
}

function parseDist(dist: string): number {
  if (dist.endsWith(' km')) return parseFloat(dist.replace(' km', '').replace(',', '.')) * 1000
  return parseInt(dist.replace(' m', ''), 10)
}

function mapInfra(infra: InfraData): InfrastrukturItem[] {
  const items: InfrastrukturItem[] = []
  if (infra.schule1) items.push({ kategorie: 'Bildung', name: infra.schule1.name, distanz: infra.schule1.dist })
  if (infra.schule2) items.push({ kategorie: 'Bildung', name: infra.schule2.name, distanz: infra.schule2.dist })
  if (infra.einkauf1) items.push({ kategorie: 'Versorgung', name: infra.einkauf1.name, distanz: infra.einkauf1.dist })
  if (infra.einkauf2) items.push({ kategorie: 'Versorgung', name: infra.einkauf2.name, distanz: infra.einkauf2.dist })
  if (infra.oepnv1) items.push({ kategorie: 'Mobilität', name: infra.oepnv1.name, distanz: infra.oepnv1.dist })
  if (infra.autobahn) items.push({ kategorie: 'Mobilität', name: infra.autobahn.name || 'Autobahnanschluss', distanz: infra.autobahn.dist })
  if (infra.arzt1) items.push({ kategorie: 'Gesundheit', name: infra.arzt1.name, distanz: infra.arzt1.dist })
  if (infra.krankenhaus) items.push({ kategorie: 'Gesundheit', name: infra.krankenhaus.name, distanz: infra.krankenhaus.dist })
  if (infra.freizeit1) items.push({ kategorie: 'Freizeit', name: infra.freizeit1.name, distanz: infra.freizeit1.dist })
  if (infra.freizeit2) items.push({ kategorie: 'Freizeit', name: infra.freizeit2.name, distanz: infra.freizeit2.dist })
  return items
}

function computeNoise(infra: InfraData): { db: number; label: string } {
  // FIXME: replace with provider's actual measurement data
  if (infra.autobahn) {
    const distM = parseDist(infra.autobahn.dist)
    if (distM < 1000) return { db: 52, label: 'Erhöhte Geräuschkulisse' }
    if (distM < 5000) return { db: 45, label: 'Mäßige Geräuschkulisse' }
  }
  if (infra.oepnv1) return { db: 38, label: 'Ruhige Lage' }
  return { db: 32, label: 'Sehr ruhige Lage' }
}

function computeLageScore(infra: InfraData): { score: number; beschreibung: string } {
  // FIXME: replace with provider's actual scoring algorithm
  let score = 6
  if (infra.oepnv1) score++
  if (infra.einkauf1) score++
  if (infra.schule1) score++
  if (infra.arzt1) score++
  if (infra.freizeit1) score++
  if (infra.autobahn) {
    const distM = parseDist(infra.autobahn.dist)
    if (distM < 2000) score--
  }
  if (!infra.oepnv1 && !infra.einkauf1 && !infra.schule1) score -= 2
  score = Math.max(1, Math.min(10, score))

  const beschreibung =
    score >= 8 ? 'Sehr gute Lage mit exzellenter Infrastruktur' :
    score >= 6 ? 'Gute Wohnlage mit solider Infrastruktur' :
    score >= 4 ? 'Durchschnittliche Lage mit Grundversorgung' :
    'Einfachere Lage mit überschaubarer Infrastruktur'

  return { score, beschreibung }
}

export class FallbackProvider implements MarketDataProvider {
  name = 'fallback' as const

  async analysiereImmobilie(listingId: string): Promise<{
    marktwert: MarktwertDaten
    lage: LageDaten
  } | null> {
    const supabase = await createClient()

    const { data: listing } = await supabase
      .from('listings')
      .select('objekttyp, adresse_strasse, adresse_plz, adresse_ort, wohnflaeche_qm, zimmer, baujahr, lat, lon')
      .eq('id', listingId)
      .single()

    if (!listing) return null

    // Cache-Check: nur geocoden wenn lat/lon fehlen
    let lat: number = listing.lat as number
    let lon: number = listing.lon as number
    if (!lat || !lon) {
      const coords = await geocodeAddress(listing.adresse_strasse, listing.adresse_plz, listing.adresse_ort)
      if (coords) {
        lat = parseFloat(coords.lat)
        lon = parseFloat(coords.lon)
        await supabase.from('listings').update({ lat, lon }).eq('id', listingId)
      }
    }

    const [infra, claudeResult] = await Promise.all([
      lat && lon ? fetchInfrastruktur(lat, lon) : Promise.resolve({} as InfraData),
      this.callClaude(listing as Record<string, unknown>, listingId),
    ])

    if (!claudeResult) return null

    const infraItems = mapInfra(infra)
    const noise = computeNoise(infra)
    const lageHeuristik = computeLageScore(infra)

    const marktwert: MarktwertDaten = {
      wert: claudeResult.wert,
      spanne: [claudeResult.spanne_min, claudeResult.spanne_max],
      mittelwert: claudeResult.wert,
      begruendung: claudeResult.begruendung,
      positive_faktoren: claudeResult.positive_faktoren,
      negative_faktoren: claudeResult.negative_faktoren,
      vergleichsobjekte: claudeResult.vergleichsobjekte.map((v): VergleichsObjekt => ({
        titel: v.titel,
        preis: v.preis,
        flaeche: v.flaeche,
        entfernung_km: v.entfernung_km,
        verkauft_am: v.verkauft_am,
        baujahr: v.baujahr,
        zimmer: v.zimmer,
      })),
      wertentwicklung: claudeResult.wertentwicklung.map((w): WertentwicklungsPunkt => ({
        jahr: w.jahr,
        preis_pro_qm: w.preis_pro_qm,
      })),
      miete_pro_monat: claudeResult.miete_pro_monat,
      miete_erklaerung: claudeResult.miete_erklaerung,
      provider_name: 'fallback',
      disclaimer: 'KI-gestützte Schätzung auf Basis öffentlicher Daten. Keine Gewähr.',
    }

    const lageDaten: LageDaten = {
      lage_score: lageHeuristik.score,
      lage_beschreibung: lageHeuristik.beschreibung,
      geraeusch_db: noise.db,
      geraeusch_label: noise.label,
      infrastruktur: infraItems,
      provider_name: 'fallback',
    }

    const { error: saveError } = await supabase
      .from('listings')
      .update({
        marktwert_daten: marktwert as unknown as Record<string, unknown>,
        lage_daten: lageDaten as unknown as Record<string, unknown>,
        marktwert_analysiert_am: new Date().toISOString(),
      })
      .eq('id', listingId)

    if (saveError) console.error('[FallbackProvider] DB-Save fehlgeschlagen:', saveError.message)

    return { marktwert, lage: lageDaten }
  }

  private async callClaude(
    listing: Record<string, unknown>,
    listingId: string,
  ): Promise<ClaudeAnalysisResult | null> {
    const currentYear = new Date().getFullYear()
    const systemPrompt = `Du bist ein erfahrener deutscher Immobilienmakler mit 20 Jahren Markterfahrung.
Analysiere die folgende Immobilie und gib eine fundierte Markteinschätzung als JSON zurück.

Antworte ausschließlich als JSON-Objekt, kein Fließtext, keine Code-Fences.

Format:
{
  "wert": number,
  "spanne_min": number,
  "spanne_max": number,
  "begruendung": string,
  "positive_faktoren": string[],
  "negative_faktoren": string[],
  "miete_pro_monat": number,
  "miete_erklaerung": string,
  "vergleichsobjekte": [
    { "titel": string, "preis": number, "flaeche": number, "entfernung_km": number, "verkauft_am": string, "baujahr": number, "zimmer": number }
  ],
  "wertentwicklung": [
    { "jahr": number, "preis_pro_qm": number }
  ]
}

Wichtige Vorgaben:
- Konservative Schätzungen, lieber etwas unter Markt als drüber
- Vergleichsobjekte: Adressen NUR vage (z.B. "3-Zimmer-Wohnung in 73433"), keine erfundenen Straßennamen + Hausnummern
- Genau 4 Vergleichsobjekte, plausibel für die Region
- Wertentwicklung: genau 5 Datenpunkte, Jahre ${currentYear - 4} bis ${currentYear}, realistische €/m²-Werte, Steigerung 2–5 % p.a.
- Mietpotenzial: realistische Kaltmiete pro Monat für Wohnfläche und Region
- positive_faktoren: 2–4 Punkte
- negative_faktoren: 2–4 Punkte`

    try {
      const message = await claudeCreate(
        {
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          system: systemPrompt,
          messages: [{ role: 'user', content: JSON.stringify(listing) }],
        },
        { callSite: 'wizard_marktwert', listingId },
      )

      const text = message.content[0].type === 'text' ? message.content[0].text : ''
      return JSON.parse(text) as ClaudeAnalysisResult
    } catch (err) {
      console.error('[FallbackProvider] Claude call failed:', err)
      return null
    }
  }
}
