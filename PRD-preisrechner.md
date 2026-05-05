# Feature-Spec: KI-Preisrechner
**du-bist-der-makler.de · Ergänzung zu PRD.md · April 2026**

---

## Kontext

Der Preisrechner ist ein Pro/Premium-Feature im Dashboard unter `/dashboard/preisrechner`.
Er ersetzt das bisherige Platzhalter-Feature KI-02 aus PRD.md vollständig.

Wenn der User bereits ein Listing angelegt hat (`/dashboard/objekt`), werden alle bekannten Felder automatisch vorausgefüllt — der User muss nur die fehlenden Informationen ergänzen.

---

## Kernidee: Drei Auswertungs-Modi

Der User wählt zu Beginn bewusst wie genau er den Preis ermitteln möchte.
Das setzt die Erwartungshaltung an die Ergebnis-Genauigkeit von Anfang an korrekt.

| Modus | Bezeichnung | Fragenanzahl | Geschätzte Dauer | Genauigkeit |
|---|---|---|---|---|
| **Schnell** | Sofort-Schätzung | 5 | ~1 Min | Grobe Orientierung (±20%) |
| **Standard** | Markteinschätzung | 12 | ~4 Min | Fundierter Richtwert (±10%) |
| **Exakt** | Vollanalyse | 22 | ~8–10 Min | Detaillierte Einschätzung (±5%) |

Die Modi sind gestaffelt aufgebaut — Exakt enthält alle Fragen von Schnell und Standard plus eigene.

---

## Fragenpool (vollständig, nach Modus)

### Gruppe A — Basis (Modus: Schnell, Standard, Exakt)

| Nr | Frage | Typ | Pflicht |
|---|---|---|---|
| A1 | Objekttyp | Select: Einfamilienhaus / Doppelhaushälfte / Reihenhaus / Wohnung / Mehrfamilienhaus / Grundstück | Ja |
| A2 | PLZ und Ort | Text + PLZ-Lookup | Ja |
| A3 | Wohnfläche (m²) | Number | Ja |
| A4 | Zimmeranzahl | Number (0,5er-Schritte) | Ja |
| A5 | Baujahr | Number (4-stellig) | Ja |

### Gruppe B — Standard (zusätzlich zu Gruppe A)

| Nr | Frage | Typ | Pflicht |
|---|---|---|---|
| B1 | Grundstücksfläche (m²) | Number — nur bei Haus-Typen anzeigen | Nein |
| B2 | Etage (bei Wohnung) | Number + Checkbox "Aufzug vorhanden" — nur bei Wohnung | Nein |
| B3 | Allgemeiner Zustand | Slider 1–5: Starker Renovierungsbedarf / Renovierungsbedarf / Gepflegt / Gut erhalten / Neuwertig | Ja |
| B4 | Heizungsart | Select: Gas / Öl / Fernwärme / Wärmepumpe / Pellet / Sonstiges / Unbekannt | Nein |
| B5 | Energieausweis-Klasse | Select: A+ / A / B / C / D / E / F / G / H / Noch nicht vorhanden | Nein |
| B6 | Stellplatz / Garage | Select: Kein / Außenstellplatz / Tiefgarage / Einzelgarage / Doppelgarage | Nein |
| B7 | Größere Renovierung in den letzten 10 Jahren? | Radio: Ja / Nein | Ja |

### Gruppe C — Exakt (zusätzlich zu Gruppe A + B)

| Nr | Frage | Typ | Pflicht |
|---|---|---|---|
| C1 | Was wurde renoviert? | Multi-Select: Küche / Bad / Fenster / Dach / Heizung / Fassade / Boden / Elektrik — nur wenn B7 = Ja | Nein |
| C2 | Was muss noch gemacht werden? | Multi-Select: gleiche Auswahl wie C1 + Freitext-Feld "Sonstiges" | Nein |
| C3 | Keller vorhanden? | Select: Nein / Ja, nicht ausgebaut / Ja, ausgebaut | Nein |
| C4 | Außenbereiche | Multi-Select: Balkon / Terrasse / Garten / Loggia / Dachterrasse | Nein |
| C5 | Wohnlage (Eigeneinschätzung) | Select: Sehr gute Lage / Gute Lage / Mittlere Lage / Einfache Lage | Ja |
| C6 | Ist die Immobilie vermietet? | Radio: Ja / Nein — wenn Ja: Number-Feld "Monatliche Mieteinnahmen (€)" | Nein |
| C7 | Wie haben Sie die Immobilie erworben? | Select: Kauf / Erbschaft / Schenkung / Sonstiges | Nein |
| C8 | Jahr des Erwerbs / der Erbschaft | Number (4-stellig) — nur wenn C7 ausgefüllt | Nein |
| C9 | Liegt eine Grundschuld vor? | Radio: Ja / Nein / Weiß nicht | Nein |
| C10 | Fotos | Aus dem Listing vorausfüllen (wenn vorhanden) oder optional hochladen — max. 10 Fotos, nur zur KI-Analyse, kein neues Upload-Widget wenn bereits im Listing vorhanden | Nein |

---

## Steuer-Hinweis (automatisch, kein Rechtsrat)

**Trigger:** C7 ist ausgefüllt UND C8 (Jahr des Erwerbs) ergibt weniger als 10 Jahre Haltedauer bis heute.

**Anzeige:** Gelbes Info-Banner direkt unter der C8-Eingabe:
> ⚠️ **Hinweis:** Bei Immobilien, die weniger als 10 Jahre gehalten werden, kann beim Verkauf Spekulationssteuer anfallen. Dies gilt nicht für selbst genutzte Immobilien. Bitte klären Sie dies mit einem Steuerberater oder Finanzamt. Wir geben keinen Steuerrat.

Kein Modal, kein Blocking — nur ein informativer Hinweis.

---

## Vorausfüllen aus dem Listing

Wenn der User ein aktives Listing hat, werden folgende Felder automatisch übernommen:

- A1 (Objekttyp), A2 (PLZ/Ort), A3 (Wohnfläche), A4 (Zimmer), A5 (Baujahr)
- B3 (Zustand), B5 (Energieausweis-Klasse), B6 (Stellplatz)
- C10 (Fotos — Liste der bereits hochgeladenen Bilder)

Vorausgefüllte Felder sind editierbar (der User kann korrigieren), aber visuell als "aus deinem Inserat übernommen" markiert (kleines Label).

---

## UX-Flow

```
1. Einstieg
   └── Modus wählen: [Schnell] [Standard] [Exakt]
       → kurze Erklärung unter jedem Modus (Fragen / Dauer / Genauigkeit)

2. Step-by-Step Fragebogen
   └── Eine Frage (oder thematische Gruppe) pro Screen
   └── Fortschrittsbalken oben (z.B. "Schritt 3 von 5")
   └── Zurück-Button immer sichtbar
   └── Vorausgefüllte Felder mit Label "Aus deinem Inserat"

3. Zusammenfassung
   └── Alle Antworten in einer Übersicht
   └── Bearbeiten-Button pro Abschnitt
   └── "Jetzt berechnen"-CTA

4. Ladescreen
   └── Spinner mit Text: "Deine Immobilie wird analysiert..."
   └── ca. 3–8 Sekunden (simuliert für MVP)

5. Ergebnis
   └── Preisspanne prominent (z.B. "340.000 € – 380.000 €")
   └── Erklärung welche Faktoren positiv/negativ wirken
   └── Genauigkeits-Label passend zum gewählten Modus
   └── Disclaimer (siehe unten)
   └── CTAs: "Neues Inserat erstellen" / "Exposé generieren" / "Makler-Stunde buchen"
   └── "Neue Berechnung starten"-Button
```

---

## Ergebnis-Anzeige (Aufbau)

```
┌─────────────────────────────────────────┐
│  Geschätzter Marktwert                  │
│  340.000 € – 380.000 €                  │
│  Mittelwert: ca. 360.000 €              │
├─────────────────────────────────────────┤
│  Positive Faktoren          ↑           │
│  • Guter Zustand (4/5)                  │
│  • Energieausweis B                     │
│  • Ruhige Wohnlage, 73xxx               │
├─────────────────────────────────────────┤
│  Faktoren die den Preis drücken können  │
│  • Baujahr 1978 (Altbau)                │
│  • Keine Renovierung der Heizung        │
├─────────────────────────────────────────┤
│  ⚠ Disclaimer (klein)                  │
│  Diese Einschätzung basiert auf KI-     │
│  Analyse und öffentlich bekannten       │
│  Marktdaten. Sie ersetzt keine          │
│  professionelle Immobilienbewertung.    │
└─────────────────────────────────────────┘
```

---

## Berechnungs-Layer (nach Entwicklungsphase)

### MVP (jetzt bauen)
- Alle Formulareingaben werden als strukturierter JSON-Prompt an Claude API gesendet
- Claude gibt Preisspanne + Einflussfaktoren zurück
- **Kein externer API-Call** (kein Boris, kein Sprengnetter)
- Output-Format: JSON mit `{ min, max, mittelwert, positive_faktoren[], negative_faktoren[], disclaimer }`
- Ergebnis wird in Supabase gespeichert (Tabelle: `preisschaetzungen`)

### Phase 2
- Bodenrichtwert-Daten über öffentliche Boris-API ergänzen (kostenlos, DE-weit)
- Als zusätzlicher Kontext in den Claude-Prompt

### Phase 3
- Optionaler Sprengnetter- oder Pricehubble-Call für Premium-User
- Nur wenn monatliches Abruf-Volumen Kosten rechtfertigt
- Als "Marktdaten-Check" als Add-on positionierbar (kein Pflicht-Feature)

---

## Claude API Prompt-Struktur (MVP)

**System-Prompt:**
```
Du bist ein erfahrener deutscher Immobilienmakler mit 20 Jahren Markterfahrung.
Analysiere die folgende Immobilie und gib eine realistische Marktwert-Einschätzung.
Antworte ausschließlich als JSON-Objekt, kein Fließtext, keine Erklärungen außerhalb des JSON.

Format:
{
  "min": number,
  "max": number,
  "mittelwert": number,
  "positive_faktoren": ["...", "..."],
  "negative_faktoren": ["...", "..."],
  "hinweis": "string (1-2 Sätze über die Datenbasis)"
}

Wichtig:
- Keine übertriebenen Preise — lieber konservativ als optimistisch
- Positive und negative Faktoren je 2–5 Punkte, konkret und nachvollziehbar
- Baujahr, Lage (PLZ/Ort), Zustand und Größe sind die wichtigsten Preistreiber
- Vermiete Objekte 10–20% niedriger bewerten (Käuferrisiko)
```

**User-Prompt:** Alle Formulardaten als JSON (alle ausgefüllten Felder).

---

## Supabase Tabelle: `preisschaetzungen`

```sql
CREATE TABLE preisschaetzungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  modus TEXT CHECK (modus IN ('schnell', 'standard', 'exakt')),
  eingaben JSONB,         -- alle Formulardaten
  ergebnis JSONB,         -- Claude API Response
  created_at TIMESTAMPTZ DEFAULT now()
);
```

RLS: User sieht nur eigene Zeilen.

---

## Paket-Zuordnung & Feature-Flag

- **Starter:** Preisrechner ist sichtbar, aber gelockt — Blur-Overlay mit Upgrade-CTA "Für Pro freischalten"
- **Pro:** Vollzugang, alle Modi
- **Premium:** Vollzugang, alle Modi (Phase 3: Sprengnetter-Call als Extra)

---

## Out of Scope (MVP)

- Sprengnetter / Pricehubble API-Integration
- PDF-Export der Bewertung
- Vergleich mehrerer Berechnungen / Verlaufsansicht
- Karte / Lagevisualisierung
- Video-Upload zur Analyse

---

## Design-Hinweise für Claude Code

- Design-System: `DESIGN.md` im Repo-Root verwenden
- Akzentfarbe: `#1B6B45`, Hover: `#145538`, Light: `#E8F5EE`
- Font: Inter, Gewichte 500/600/700
- Modus-Auswahl als große Card-Picker (nicht Radio-Buttons)
- Step-by-Step: eine Frage pro Screen, kein langer Scroll-Fragebogen
- Fortschrittsbalken: oben, grün (#1B6B45), animiert
- Ergebnis: Preisspanne in großer Schrift, Faktoren als grüne/rote Pill-Tags
- Mobile-first: alle Screens vollständig unter 768px nutzbar
- Ladescreen: kein nackter Spinner — kurzen animierten Text zeigen ("Wir analysieren deine Immobilie...")

---

*Spec v1.0 · du-bist-der-makler.de · April 2026*
