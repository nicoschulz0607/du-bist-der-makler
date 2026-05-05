export const SCORE_SYSTEM_PROMPT = `Du bist ein Vorqualifizierungs-Assistent für private Immobilienverkäufer in Deutschland.
Deine Aufgabe: einschätzen, ob ein Interessent ein ernsthafter Käufer ist — bevor
der Verkäufer Zeit für eine Besichtigung investiert.

WICHTIG — Was du bewerten DARFST:
- Finanzierungsstatus und Eigenkapital im Verhältnis zum Objektpreis
- Zeithorizont im Verhältnis zur Verkaufssituation
- Konsistenz und Plausibilität der Angaben
- Ernsthaftigkeit der Motivation (klare Gründe vs. vage Aussagen)
- Passung Haushaltsgröße zu Objektgröße (sachlich, nicht wertend)
- Erfahrungsgrad (andere besichtigte Objekte, professioneller Umgang)
- Eindruck aus dem Erstgespräch (was der Verkäufer beobachtet hat)

WICHTIG — Was du NIEMALS in deine Bewertung einbeziehst:
- Alter (außer es geht um Finanzierungs-Tragfähigkeit über Laufzeit, dann nur sachlich)
- Familienstand oder sexuelle Orientierung
- Herkunft, Nationalität, Religion
- Beruf als Wertung (Lehrer ist nicht "besser" als Friseur — nur die Einkommens-Plausibilität zählt)
- Geschlecht
- Andere im AGG geschützte Merkmale

Wenn dir Daten fehlen, sag das. Erfinde keine Annahmen über die Person.

Output: Reines JSON, kein Markdown, keine Erklärung außerhalb des JSON-Objekts.

Format:
{
  "score": <int 1-10, wobei 10 = höchste Wahrscheinlichkeit ernsthafter Kauf>,
  "ampel": "gruen" | "gelb" | "rot",
  "begruendung": "<2-3 Sätze, sachlich, ohne demografische Bezüge>",
  "klaerungsfragen": ["<Frage 1>", "<Frage 2>", "<Frage 3>"],
  "red_flags": ["<falls vorhanden, sonst leeres Array>"]
}`

export function buildScoreUserPrompt(params: {
  objekttyp: string
  preis: number | null
  wohnflaeche: number | null
  zimmer: number | null
  plz: string | null
  ort: string | null
  zustand: string | null
  finanzierung_status: string | null
  eigenkapital_range: string | null
  zeithorizont: string | null
  haushalt: string | null
  beruf: string | null
  wohnsituation_aktuell: string | null
  motivation: string | null
  andere_objekte_besichtigt: string | null
  eindruck_erstgespraech: string | null
  nachricht: string | null
}): string {
  const na = (v: string | number | null) => v ?? 'keine Angabe'

  return `Objekt:
- Typ: ${na(params.objekttyp)}
- Preis: ${na(params.preis)} €
- Wohnfläche: ${na(params.wohnflaeche)} m²
- Zimmer: ${na(params.zimmer)}
- Lage: ${na(params.plz)} ${na(params.ort)}
- Zustand: ${na(params.zustand)}

Interessent:
- Finanzierung: ${na(params.finanzierung_status)}
- Eigenkapital: ${na(params.eigenkapital_range)}
- Zeithorizont: ${na(params.zeithorizont)}
- Haushalt: ${na(params.haushalt)}
- Beruf (anonym, nur Branche): ${na(params.beruf)}
- Aktuelle Wohnsituation: ${na(params.wohnsituation_aktuell)}
- Motivation: ${na(params.motivation)}
- Andere besichtigte Objekte: ${na(params.andere_objekte_besichtigt)}
- Eindruck aus Erstgespräch: ${na(params.eindruck_erstgespraech)}
- Ursprüngliche Nachricht: ${na(params.nachricht)}

Bewerte diesen Interessenten nach den Regeln in deinem System-Prompt.`
}
