import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ExposeInput {
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
  wasIstBesonders: string
  idealeKaeufer: string
}

export interface ExposeOutput {
  titel: string
  tagline: string
  beschreibung_kurz: string
  beschreibung_lang: string
  ausstattung_text: string
  lage_text: string
  highlights: string[]
}

export async function generiereExpose(input: ExposeInput): Promise<ExposeOutput> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  const lageKontext = input.adresse_plz && input.adresse_ort
    ? `${input.adresse_plz} ${input.adresse_ort}, Deutschland`
    : input.adresse_ort
    ? `${input.adresse_ort}, Deutschland`
    : 'Standort nicht angegeben'

  const listing = {
    objekttyp: input.objekttyp,
    adresse: `${input.adresse_strasse ?? ''}, ${input.adresse_plz ?? ''} ${input.adresse_ort ?? ''}`.trim(),
    wohnflaeche_qm: input.wohnflaeche_qm,
    zimmer: input.zimmer,
    baujahr: input.baujahr,
    zustand: input.zustand,
    preis: input.preis,
    energieausweis_klasse: input.energieausweis_klasse,
    beschreibung: input.beschreibung,
  }

  const systemPrompt = `Du bist ein erfahrener deutscher Immobilienmakler mit 20 Jahren Erfahrung.
Du schreibst Exposés die:
- Emotionen wecken ohne zu übertreiben oder zu lügen
- Fakten elegant in Fließtext einweben, nicht als Liste aufzählen
- Die ideale Käuferperson direkt und konkret ansprechen
- Nie generisch klingen — jedes Exposé ist einzigartig
- Keine leeren Buzzwords: nie "traumhaft", "einmalig", "hochwertig" ohne konkreten Beleg
- Immer auf Deutsch, professionell und warmherzig

Du antwortest AUSSCHLIESSLICH mit einem JSON-Objekt. Kein Kommentar davor oder danach.`

  const userPrompt = `Erstelle ein professionelles Immobilien-Exposé aus diesen Daten:

OBJEKT-DATEN:
${JSON.stringify(listing, null, 2)}

LAGE-KONTEXT:
${lageKontext}

VERKÄUFER-FREITEXT:
Was ist besonders: "${input.wasIstBesonders || 'Keine Angabe'}"
Ideale Käufer: "${input.idealeKaeufer || 'Keine Angabe'}"

Antworte mit exakt diesem JSON:
{
  "titel": "Prägnanter Titel mit Ort und USP (max. 80 Zeichen)",
  "tagline": "Ein Satz der die Zielgruppe direkt anspricht (max. 120 Zeichen)",
  "beschreibung_kurz": "3 Sätze für Portal-Preview — zieht sofort an",
  "beschreibung_lang": "4–6 Absätze Fließtext — Objekt, Ausstattung, Lage, Atmosphäre. Absätze mit \\n\\n trennen.",
  "ausstattung_text": "Ausstattungs-Highlights in 2–3 Sätzen Fließtext formuliert",
  "lage_text": "Lage und Infrastruktur in 2–3 Sätzen, basierend auf Lage-Kontext",
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"]
}`

  try {
    const response = await anthropic.messages.create(
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      },
      { signal: controller.signal }
    )

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const clean = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    return JSON.parse(clean) as ExposeOutput
  } finally {
    clearTimeout(timeout)
  }
}
