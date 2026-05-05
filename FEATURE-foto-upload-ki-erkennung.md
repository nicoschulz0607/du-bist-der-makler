# Feature: Intelligenter Foto-Upload mit KI-Raumerkennung

> Ziel: Jedes hochgeladene Foto wird automatisch via Claude Haiku Vision analysiert,
> mit einem Raumtyp gelabelt und die Labels fließen direkt ins Exposé ein.
> Funktioniert für Einzeluploads genauso wie für 30 Bilder auf einmal.

---

## Was gebaut wird

Der bestehende Foto-Upload auf `/dashboard/objekt` wird erweitert:
- User lädt 1 bis 30 Fotos hoch — einzeln oder alle auf einmal per Drag & Drop
- Jedes Foto wird sofort in Supabase Storage hochgeladen (parallel, nicht sequenziell)
- Nach dem Upload: automatischer Claude Haiku Vision API-Call pro Foto
- KI erkennt Raumtyp und beschreibt das Bild in einem Satz
- User sieht KI-Vorschlag direkt auf der Foto-Kachel — bestätigen oder per Dropdown korrigieren
- Labels + Beschreibungen werden in Supabase gespeichert
- Der Exposé-Generator nutzt die Labels um Bilder gezielt zu platzieren

---

## 1. Supabase — Datenstruktur erweitern

Das Fotos-Array im `listings`-Eintrag bekommt pro Foto neue Felder:

**Bisherige Struktur (listings.fotos):**
```json
[
  { "url": "...", "ist_titelbild": true }
]
```

**Neue Struktur:**
```json
[
  {
    "url": "https://...",
    "storage_path": "listings/user_id/listing_id/foto1.jpg",
    "ist_titelbild": true,
    "raumtyp": "Wohnzimmer",
    "beschreibung": "Helles Wohnzimmer mit Parkettboden und großen Fenstern",
    "ki_konfidenz": 0.92,
    "raumtyp_manuell": false,
    "analyse_status": "fertig"
  }
]
```

**Felder:**
- `raumtyp` — KI-Vorschlag oder manuelle Auswahl des Users
- `beschreibung` — 1 Satz was auf dem Bild zu sehen ist (für Exposé-Bildunterschriften)
- `ki_konfidenz` — Zahl zwischen 0 und 1 (unter 0.7 = Badge "Bitte prüfen")
- `raumtyp_manuell` — true wenn User das Label geändert hat
- `analyse_status` — `"ausstehend"` | `"analysiert"` | `"fehler"` (für UI-Zustand)

---

## 2. Bulk-Upload — so funktioniert es bei 1 bis 30 Fotos gleichzeitig

### Der kritische Punkt: Parallelität ohne Chaos

Wenn ein User 20 Fotos auf einmal dropped, darf nichts blockieren oder abstürzen.
Die Logik läuft in drei Phasen:

**Phase 1 — Sofort nach Drop/Auswahl (UI-seitig):**
```
Alle gewählten Dateien werden SOFORT als Platzhalter-Kacheln im Grid angezeigt
→ Jede Kachel zeigt: Foto-Vorschau + Spinner + "Wird hochgeladen..."
→ User sieht sofort dass etwas passiert — kein leerer Zustand
```

**Phase 2 — Upload zu Supabase Storage (parallel):**
```typescript
// ALLE Fotos gleichzeitig hochladen — nicht nacheinander warten
const uploadResults = await Promise.allSettled(
  files.map(file => uploadFotoToStorage(file, listingId))
)
// allSettled statt all → ein fehlgeschlagenes Foto bricht nicht die anderen ab
```

**Phase 3 — KI-Analyse (parallel, mit Concurrency-Limit):**
```typescript
// NICHT alle 30 auf einmal an die API schicken → Rate Limit Risiko
// Stattdessen: max. 5 gleichzeitig, dann nächste 5 usw.

async function analysiereAlleParallel(fotos: FotoMitUrl[]) {
  const BATCH_GROESSE = 5
  const ergebnisse = []

  for (let i = 0; i < fotos.length; i += BATCH_GROESSE) {
    const batch = fotos.slice(i, i + BATCH_GROESSE)
    const batchErgebnisse = await Promise.allSettled(
      batch.map(foto => analysiereFotoMitKI(foto))
    )
    ergebnisse.push(...batchErgebnisse)
    // Kurze Pause zwischen Batches um Rate Limits zu vermeiden
    if (i + BATCH_GROESSE < fotos.length) {
      await new Promise(r => setTimeout(r, 300))
    }
  }
  return ergebnisse
}
```

**Wichtig:** Upload (Phase 2) und KI-Analyse (Phase 3) laufen nacheinander pro Foto —
erst wenn das Foto in Storage ist, wird es analysiert. Aber alle Fotos laufen parallel durch.

---

## 3. UI-Zustand pro Foto-Kachel — die drei Phasen sichtbar machen

Jede Kachel hat genau einen von diesen Zuständen:

```
[WIRD HOCHGELADEN]     → Spinner + graue Kachel + "Wird hochgeladen..."
[WIRD ANALYSIERT]      → Foto sichtbar + pulsierender grüner Ring + "KI erkennt Raum..."
[FERTIG - SICHER]      → Foto + grünes Label "Wohnzimmer" (konfidenz ≥ 0.7)
[FERTIG - UNSICHER]    → Foto + oranges Label "Wohnzimmer ?" (konfidenz < 0.7)
[FEHLER]               → Foto + graues Label "Nicht erkannt" + Dropdown direkt offen
```

### Das Ergebnis-Feedback (der "Aha-Moment" für den User):

Wenn die KI-Analyse zurückkommt, zeigt die Kachel:

```
┌─────────────────────────────┐
│  [Foto des Schlafzimmers]   │
│                             │
│  ✓ Schlafzimmer             │  ← grünes Badge, klickbar
│  Doppelbett mit Einbau-     │  ← Beschreibung klein darunter
│  schrank und Parkett        │
└─────────────────────────────┘
```

Klick auf das Badge öffnet ein Dropdown zur Korrektur:
```
✓ Schlafzimmer          ← aktuell ausgewählt
  Wohnzimmer
  Küche
  Badezimmer
  Kinderzimmer
  Arbeitszimmer
  ... (alle Raumtypen)
```

Nach Auswahl: Label wechselt sofort, wird direkt in Supabase gespeichert,
kurze Toast-Meldung: "Label aktualisiert ✓"

---

## 4. Claude Haiku Vision — API-Call

**Model:** `claude-haiku-4-5-20251001`

**Kosten:** ~1.500 Tokens pro Bild × $0,000001 = ~0,15 Cent pro Bild
→ 30 Fotos = ca. **4 Cent pro User** — vernachlässigbar.

**API-Route:** `app/api/analyze-foto/route.ts`

```typescript
// Vor dem API-Call: Bild auf max. 1200px skalieren (spart Tokens, reicht für Erkennung)
// Im Browser via Canvas, auf Server via sharp

export async function POST(request: Request) {
  // 1. Auth prüfen — kein öffentlicher Endpoint
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { imageBase64, mediaType } = await request.json()

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: `Du bist ein Assistent für Immobilien-Exposés in Deutschland.
Analysiere das Foto einer Immobilie und antworte AUSSCHLIESSLICH mit einem JSON-Objekt.
Kein erklärender Text, keine Markdown-Backticks, nur reines JSON.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType, // "image/jpeg" | "image/png" | "image/webp"
                data: imageBase64
              }
            },
            {
              type: "text",
              text: `Welcher Raumtyp ist auf diesem Immobilienfoto zu sehen?
Antworte nur als JSON:
{
  "raumtyp": "<exakt einer von: Wohnzimmer | Küche | Schlafzimmer | Badezimmer | Gäste-WC | Kinderzimmer | Arbeitszimmer | Esszimmer | Flur | Keller | Dachboden | Garage | Carport | Garten | Terrasse | Balkon | Außenansicht | Grundriss | Sonstiges>",
  "beschreibung": "<Ein präziser deutscher Satz was auf dem Bild zu sehen ist, max. 15 Wörter>",
  "konfidenz": <Zahl zwischen 0.0 und 1.0>
}`
            }
          ]
        }
      ]
    })
  })

  const data = await response.json()

  try {
    const result = JSON.parse(data.content[0].text)
    return Response.json(result)
  } catch {
    // JSON-Parsing fehlgeschlagen → Fallback
    return Response.json({ raumtyp: null, beschreibung: null, konfidenz: 0 })
  }
}
```

**Timeout-Handling im Frontend:**
```typescript
// Wenn die Analyse nach 15 Sekunden nicht zurückkommt → Fehler-Zustand
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 15000)

try {
  const result = await fetch("/api/analyze-foto", {
    signal: controller.signal,
    // ...
  })
} catch {
  // Timeout oder Netzwerkfehler → Kachel zeigt "Nicht erkannt" mit Dropdown
  setFotoStatus(fotoId, "fehler")
} finally {
  clearTimeout(timeout)
}
```

---

## 5. Alle Raumtypen

```typescript
export const RAUMTYPEN = [
  "Wohnzimmer", "Küche", "Schlafzimmer", "Badezimmer", "Gäste-WC",
  "Kinderzimmer", "Arbeitszimmer", "Esszimmer", "Flur",
  "Keller", "Dachboden", "Garage", "Carport",
  "Garten", "Terrasse", "Balkon", "Außenansicht",
  "Grundriss", "Sonstiges"
] as const

export type Raumtyp = typeof RAUMTYPEN[number]
```

---

## 6. Exposé-Generator — Labels nutzen

**Datei:** `app/api/generate-expose/route.ts`

```typescript
const fotoContext = fotos
  .filter(f => f.raumtyp && f.raumtyp !== "Sonstiges")
  .map(f => `- ${f.raumtyp}: "${f.beschreibung}" → ${f.url}`)
  .join("\n")

// Im Exposé-System-Prompt ergänzen:
`Verfügbare Fotos mit Raumtyp und Beschreibung:
${fotoContext}

Regeln für die Bildnutzung:
- Platziere Fotos sinnvoll zur passenden Textsektion
- Nutze die Beschreibungen als Bildunterschriften
- Titelbild = erstes Foto mit raumtyp "Außenansicht", sonst das erste Foto überhaupt
- Wenn kein Foto für einen Raumtyp vorhanden ist: Sektion weglassen, KEIN Platzhalter`
```

---

## 7. Grenzfälle — was darf nicht passieren

| Situation | Verhalten |
|---|---|
| User lädt 30 Fotos auf einmal | Upload parallel, Analyse in 5er-Batches — kein Crash |
| Claude-API antwortet nicht | Nach 15s Timeout → "Nicht erkannt", Dropdown offen |
| JSON-Parsing schlägt fehl | Fallback auf `raumtyp: null`, User kann manuell wählen |
| Netzwerkfehler beim Upload | Kachel zeigt Fehler + Retry-Button, andere Fotos unberührt |
| Gleicher Raumtyp mehrfach (5 Badfotos) | Kein Problem — alle Labels gesetzt, alle gültig |
| Foto ist kein Raum (Dokument, Selfie) | KI wählt "Sonstiges" mit niedriger Konfidenz → Orange Badge |
| User löscht Foto während Analyse läuft | AbortController cancelt den API-Call, Kachel wird entfernt |

---

## 8. Was NICHT gebaut wird (MVP)

- Keine KI-Bildverbesserung (separates Premium-Feature via Replicate)
- Kein Hinweis "du hast noch kein Badezimmer-Foto" (Phase 2)
- Kein Bulk-Relabeling per Mehrfachauswahl
- Keine automatische Duplikat-Erkennung

---

## Zusammenfassung des kompletten Flows

```
User droppt 1–30 Fotos
        ↓
Sofort: Alle Kacheln als Platzhalter anzeigen ("Wird hochgeladen...")
        ↓
Parallel: Alle Fotos → Supabase Storage
        ↓
Nach Upload pro Foto: Kachel zeigt Foto + "KI erkennt Raum..."
        ↓
In 5er-Batches: Claude Haiku Vision API
        ↓
Ergebnis pro Foto (unabhängig voneinander):
  → Grün (konfidenz ≥ 0.7): "Schlafzimmer — Doppelbett mit Einbauschrank und Parkett"
  → Orange (konfidenz < 0.7): "Wohnzimmer ?" → User soll bestätigen
  → Grau (Fehler/Timeout): "Nicht erkannt" → Dropdown direkt offen
        ↓
User korrigiert bei Bedarf → speichert sofort in Supabase
        ↓
Exposé-Generator nutzt Labels für saubere Bildplatzierung — keine Platzhalter
```
