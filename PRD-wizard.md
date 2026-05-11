# PRD — Geführter Verkaufs-Wizard

> **dubistdermakler.de** · Version 1.0 · Mai 2026
> Erweiterung zu PRD v1.0 (siehe `PRD.md`)

Dieses Dokument beschreibt den **geführten Wizard**, der als optionaler Modus zusätzlich zu den bestehenden Dashboard-Modulen entsteht. Es ergänzt das Haupt-PRD und ersetzt mittelfristig den bisherigen Bereich „Schritt-für-Schritt" (statische Checkliste) durch eine Tutorial-artige, geführte Reise vom ersten Login bis zum Live-Inserat.

---

## 1. Vision & Abgrenzung

### Problem

Private Verkäufer ohne Vorerfahrung wissen oft nicht, in welcher Reihenfolge sie was tun müssen. Sie scrollen durch viele Tools und Artikel, fühlen sich überfordert und brechen ab — oder buchen am Ende doch einen Makler. Genau diese Zielgruppe ist unser Kern.

### Lösung

Ein optionaler, Tutorial-artiger Wizard, der den Nutzer in **12 Stationen** durch den gesamten Verkaufsprozess führt — von Grunddaten über Marktwert, Energieausweis, Fotos und Inserat-Texte bis zur Veröffentlichung. Er nutzt die bestehenden Module im Hintergrund, ist aber eine eigene Fullscreen-Erfahrung.

### Inspiration

Onboarding-Tutorials in mobilen Spielen (z. B. Clash Royale): du machst die Sache selbst, das Tutorial zeigt nur wohin. Kein Modal-Inferno, kein Wall of Text. Ein Schritt nach dem anderen, mit klarer Aktion.

### Was der Wizard NICHT ist

- **Kein Ersatz für die bestehenden Module** — `/dashboard/objekt`, `/expose`, `/preisrechner`, `/expose-pdf`, `/termine`, `/interessenten` bleiben unverändert.
- **Kein Pflicht-Onboarding** — wer den Wizard nicht will, klickt ihn weg und nutzt die Plattform wie bisher.
- **Kein zweites Datenmodell** — der Wizard schreibt in dieselben DB-Tabellen wie die Module.
- **Keine Tipp-Sintflut** — Hinweise sind standardmäßig eingeklappt, der Nutzer entscheidet ob er sie aufklappt.

---

## 2. Architekturprinzipien

- **Eigene Fullscreen-Seite.** Route `/dashboard/start`. Eigenes Layout ohne Sidebar und Dashboard-Chrome. Header oben mit Fortschritt + Verlassen-Button, Footer unten mit Zurück / Klara fragen / Weiter.
- **Single Source of Truth: bestehende Tabellen.** Der Wizard schreibt in `users`, `listings`, `fotos`, `preisschaetzungen` etc. — also in dieselben Tabellen, die die Module nutzen. Verlässt der Nutzer den Wizard und öffnet `/dashboard/objekt`, sieht er dort dieselben Daten.
- **Eigene Wizard-Tabelle nur für Meta-Daten.** Eine neue Tabelle `wizard_progress` speichert nur: aktuelle Station, Skip-Status pro Station, gestartet_am, abgeschlossen_am. Die Inhalte selbst leben in den bestehenden Tabellen.
- **Provider-Adapter für Marktdaten.** Marktwert-Schätzung läuft über ein Interface `MarketDataProvider` mit Implementierungen für Pricehubble, Sprengnetter, Value AG und einen internen Fallback (Claude + OSM). Welcher Provider aktiv ist, wird über eine ENV-Variable gesteuert. So bleibt der Wizard nach dem Anbieter-Meeting flexibel.
- **Tipps & Recht eingeklappt by default.** Pro Station gibt es maximal einen einzigen, dezenten „Tipps & rechtliche Hinweise"-Aufklapper. Der Hauptinhalt ist immer Aktion zuerst, Erklärung erst auf Wunsch.
- **Skip-Pfade explizit.** Pflichtdaten (Adresse, Wohnfläche, Preis, mind. 1 Foto) blockieren nur das finale Veröffentlichen. Komfort-Stationen (Energieausweis, Grundriss, KI-Bildverbesserung) sind frei skipbar mit klarem „später nachreichen"-Pfad.
- **Klara als ruhiger Begleiter.** Pro Station ein „Frage an Klara"-Button im Footer. Öffnet einen Slide-Over von rechts mit der bestehenden Klara-Logik. Keine Floating Bubble innerhalb des Wizards — die ist im normalen Dashboard schon da.

---

## 3. Wann wird der Wizard angeboten?

### 3.1 Aktiver Vorschlag nach Onboarding

Direkt nach erfolgreichem Stripe-Checkout und der ersten Anmeldung im Dashboard erscheint ein zentriertes Modal mit drei kurzen Fragen:

- Ist das deine erste Immobilie, die du verkaufst?
- Wie sicher fühlst du dich beim Thema Verkauf? (1–5)
- Möchtest du Schritt für Schritt durch den Prozess geführt werden?

Wenn der Nutzer Ja zur dritten Frage sagt → Weiterleitung zu `/dashboard/start`. Wenn Nein → normales Dashboard, das Modal kommt nicht erneut.

### 3.2 Permanent zugänglich

Im Dashboard-Sidebar-Bereich „Mein Verkauf" ist „Geführter Modus" als Eintrag immer sichtbar — neben „Übersicht" und „Mein Objekt". Wer den Wizard im Onboarding abgelehnt hat, kann ihn jederzeit selbst starten.

### 3.3 Wiedereinstieg

Wer den Wizard mittendrin verlässt, sieht bei der nächsten Anmeldung im Dashboard einen schmalen Banner: „Du warst bei Schritt 6 von 12 — weitermachen?". Wegklickbar. Erscheint nicht mehr als 3-mal.

---

## 4. Die 12 Stationen im Detail

Jede Station folgt demselben Layout: Schritt-Nummer + Titel oben, klare Hauptaktion in der Mitte, optionale Tipps eingeklappt darunter, Footer mit Zurück / Klara / Weiter.

Die Stationen sind in 4 Phasen gruppiert. Phase und Station werden in der Header-Fortschrittsleiste angezeigt.

| Phase              | Stationen | Ziel der Phase                                                       |
| ------------------ | --------- | -------------------------------------------------------------------- |
| Vorbereitung       | 1 – 3     | Verkäuferprofil und Objekt-Grunddaten erfassen.                      |
| Bewertung & Daten  | 4 – 6     | Marktwert ermitteln, Lage analysieren, Energieausweis klären.        |
| Inserat aufbauen   | 7 – 10    | Fotos, Grundriss, Ausstattung, KI-Inserat-Texte und PDF-Exposé.      |
| Live gehen         | 11 – 12   | Vorschau, Rechtscheck, Veröffentlichung.                             |

### Station 1 — Willkommen & Standortbestimmung

- **Phase:** Vorbereitung
- **Modul-Bezug:** Eigene Logik
- **Skipbar:** Nein
- **Was passiert:** Kurzes 3-Fragen-Quiz (erste Immobilie, Zeithorizont, gewünschtes Tempo). Daraus passt sich der Wizard an — ein Erbe mit Zeitdruck bekommt andere Tipps als ein Vermieter mit Strategie.
- **Hauptaktion:** Drei Multiple-Choice-Fragen, jede mit 3–4 Optionen.
- **Datenfluss:** Antworten landen in `wizard_progress.wizard_profile` (JSONB). Beeinflusst späteren Tipp-Inhalt.
- **Eingeklappter Hinweis:** Keine Tipps. Reine Profilierung.

### Station 2 — Persönliche Eckdaten

- **Phase:** Vorbereitung
- **Modul-Bezug:** `users`
- **Skipbar:** Nein
- **Was passiert:** Vorname, Telefon, Postanschrift. Diese Daten erscheinen später automatisch im Exposé-PDF und im Kontakt-Block des öffentlichen Inserats.
- **Hauptaktion:** Schlankes Formular, 5 Felder.
- **Datenfluss:** Schreibt direkt in `users`-Tabelle (Vorname, Telefon, etc.).
- **Eingeklappter Hinweis:** Rechtliche Pflichtangaben im Inserat (Anbieter-Identifikation laut TMG).

### Station 3 — Objekt-Grunddaten

- **Phase:** Vorbereitung
- **Modul-Bezug:** `/dashboard/objekt` (DB: `listings`)
- **Skipbar:** Teilweise — Adresse, Fläche, Zimmer sind Pflicht. Baujahr und Etage skipbar.
- **Was passiert:** Objekttyp (Haus / Wohnung / Grundstück), Adresse mit Geocoding, Wohnfläche, Zimmer, Baujahr, Zustand.
- **Hauptaktion:** Schritt-für-Schritt-Formular mit großen Inputs, ein Feld pro Block, Inline-Validierung.
- **Datenfluss:** Schreibt in `listings`-Tabelle. Geocoding (lat/lon) sofort beim Verlassen des Adressfelds.
- **Eingeklappter Hinweis:** Warum die Adresse stimmen muss (Marktdatenabfrage, Inseratsanzeige).

### Station 4 — Lage & Umgebung

- **Phase:** Bewertung & Daten
- **Modul-Bezug:** `MarketDataProvider` (Pricehubble / Sprengnetter / Fallback)
- **Skipbar:** Nein, aber rein passiv — Nutzer klickt nur „Weiter".
- **Was passiert:** Sobald die Adresse aus Station 3 vorliegt, ruft der Wizard im Hintergrund den aktiven `MarketDataProvider` auf. Der Nutzer sieht: Lage-Score, Geräuschpegel, Erreichbarkeit (ÖPNV, Schulen, Versorgung), vergleichbare Angebote in der Nachbarschaft. Das ist der Wow-Moment.
- **Hauptaktion:** Daten werden visualisiert dargestellt (Karte + Kennzahlen). Nutzer scrollt durch, klickt Weiter.
- **Datenfluss:** Provider-Antwort wird in `listings.lage_daten` (JSONB) gecached. Bei Provider-Fehler: Fallback auf bestehende Overpass/Claude-Lösung, kein Blocker.
- **Eingeklappter Hinweis:** Was die Daten bedeuten und wie sie den Marktwert beeinflussen.

### Station 5 — Marktwert ermitteln

- **Phase:** Bewertung & Daten
- **Modul-Bezug:** `/dashboard/preisrechner` (DB: `preisschaetzungen`) + `MarketDataProvider`
- **Skipbar:** Ja — Nutzer kann eigenen Wunschpreis eintragen ohne Schätzung.
- **Was passiert:** `MarketDataProvider` liefert Preisspanne mit Begründung (z. B. „413.100 € · 378.100 – 488.700 €"). Nutzer sieht zusätzlich ähnliche verkaufte Objekte. Setzt dann seinen Verkaufspreis.
- **Hauptaktion:** Großer Slider innerhalb der Spanne mit Live-Effekt-Anzeige („voraussichtliche Verkaufsdauer steigt bei höherem Preis").
- **Datenfluss:** Schätzung in `preisschaetzungen`, finaler Verkaufspreis in `listings.preis`.
- **Eingeklappter Hinweis:** Warum ein zu hoher Startpreis die Verkaufsdauer im Schnitt um 4 Monate verlängert.

### Station 6 — Energieausweis

- **Phase:** Bewertung & Daten
- **Modul-Bezug:** Datei-Upload + Partner-iFrame
- **Skipbar:** Ja — drei explizite Optionen.
- **Was passiert:** Drei klare Optionen — (a) bestehenden Energieausweis hochladen, (b) über Partner-iFrame bestellen (2–3 Werktage), (c) bei Besichtigung vorlegen — wie es ImmoScout-Verkäufer auch machen.
- **Hauptaktion:** Drei große Buttons. Bei (a) Datei-Upload, bei (b) iFrame-Modal mit Partner-Bestellseite, bei (c) Status „nachzureichen".
- **Datenfluss:** Upload landet in Supabase Storage. Status (`vorhanden` / `bestellt` / `nachzureichen`) in `listings.energieausweis_status`. Bei (c) Hinweis im finalen Rechtscheck.
- **Eingeklappter Hinweis:** Bußgeld bis 15.000 €, Pflicht zur Vorlage spätestens bei der Besichtigung. Verbrauchs- vs. Bedarfsausweis.

### Station 7 — Fotos hochladen

- **Phase:** Inserat aufbauen
- **Modul-Bezug:** `/dashboard/objekt` FotoUpload-Komponente (DB: `fotos`)
- **Skipbar:** Nein — mind. 1 Foto Pflicht. Ideal sind 8–15.
- **Was passiert:** Drag-and-Drop-Upload. Claude Sonnet Vision erkennt Raumtyp automatisch, Nutzer kann korrigieren. Sortierung per Drag-and-Drop. Erstes Foto ist Titelbild.
- **Hauptaktion:** Großzügige Drop-Zone, Mini-Galerie, Live-Klassifizierung.
- **Datenfluss:** Schreibt in `fotos`-Tabelle und Supabase Storage Bucket `listing-photos`.
- **Eingeklappter Hinweis:** Gute Fotos = 30 % schnellerer Verkauf. Tageslicht, Querformat, aufgeräumt, keine Personen, keine Spiegelbilder.

### Station 8 — Grundriss

- **Phase:** Inserat aufbauen
- **Modul-Bezug:** Datei-Upload (DB: `listings.grundriss_url`)
- **Skipbar:** Ja — explizit „später bei Besichtigung mitbringen".
- **Was passiert:** Optionaler Upload eines Grundrisses (PDF oder Bild). Drei Optionen: hochladen / habe noch keinen / bringe ich zur Besichtigung mit.
- **Hauptaktion:** Drei Buttons mit Skip-Pfad analog Energieausweis.
- **Datenfluss:** Datei in Storage, URL in `listings.grundriss_url`.
- **Eingeklappter Hinweis:** Grundriss erhöht Anfragequote signifikant. Wer keinen hat: Tools wie Roomle oder Skizze mit Maßen reichen oft.

### Station 9 — Ausstattung & Beschreibung

- **Phase:** Inserat aufbauen
- **Modul-Bezug:** `/dashboard/objekt` Ausstattungs-Sektion + Klara-Hilfe
- **Skipbar:** Pflicht: Ausstattung ja/nein. Beschreibungstext skipbar (KI generiert ihn dann selbst in Station 10).
- **Was passiert:** Strukturierte Checkboxen für Ausstattung (Balkon, Keller, Garten, Garage, Aufzug, etc.). Optional: Freitext-Beschreibung. Klara hilft per Button beim Verfassen.
- **Hauptaktion:** Checkbox-Grid, darunter optionales Textfeld.
- **Datenfluss:** `listings.ausstattung` (Array), `listings.beschreibung` (Text).
- **Eingeklappter Hinweis:** Was rechtlich nicht in Beschreibungen darf (Diskriminierung nach AGG, übertriebene Werbeversprechen, falsche Tatsachenangaben).

### Station 10 — Inserat-Texte generieren

- **Phase:** Inserat aufbauen
- **Modul-Bezug:** `/dashboard/expose` (DB: `listings.expose_*`)
- **Skipbar:** Nein — Inserat braucht Text. Aber Nutzer kann KI-Vorschlag direkt akzeptieren ohne Edits.
- **Was passiert:** KI-Exposé-Generator wird aufgerufen. Output: Titel, Kurzbeschreibung, Volltext, Highlights — alle Sektionen einzeln editierbar.
- **Hauptaktion:** 4 Karten (Titel / Kurz / Volltext / Highlights) mit Edit-Möglichkeit. Großer „Übernehmen"-Button.
- **Datenfluss:** Schreibt in `listings.expose_titel`, `expose_kurz`, `expose_volltext`, `expose_highlights`. Das bestehende `expose_edits`-Feld bleibt für manuelle Überarbeitungen.
- **Eingeklappter Hinweis:** Was einen guten Inseratstitel ausmacht (max. 80 Zeichen, ein konkretes Highlight, keine Floskeln).

### Station 11 — Vorschau & Rechtscheck

- **Phase:** Live gehen
- **Modul-Bezug:** Inserat-Vorschau (lesend) + Validierungs-Engine
- **Skipbar:** Nein — letzter Pflicht-Stop vor Veröffentlichung.
- **Was passiert:** Linke Seite — Live-Vorschau des Inserats, exakt wie es auf `/inserate/[slug]` erscheinen wird. Rechte Seite — Pflicht-Checkliste mit grün/gelb/rot — Pflichtfelder, Energieausweis-Status, Pflichtangaben (Anbieter, Provisionsfreiheit).
- **Hauptaktion:** Pro Issue ein Link, der direkt zur betroffenen Station zurückspringt — der Nutzer kann gezielt nachbessern.
- **Datenfluss:** Reine Validierung, keine Schreiboperationen. Nutzt `validate(listing)` Hook.
- **Eingeklappter Hinweis:** Rechtliche Pflichtangaben im Detail (Energieausweis-Daten, Anbieter-Identifikation, Provisionsangabe — auch bei Privatverkauf).

### Station 12 — Veröffentlichen

- **Phase:** Live gehen
- **Modul-Bezug:** `listings.status` + Portal-Sync (Premium)
- **Skipbar:** Nein — das ist das Ziel.
- **Was passiert:** Großer „Jetzt veröffentlichen"-Button. Setzt `listings.status` auf `aktiv`. Bei Premium-Tier — Trigger für ImmoScout/Kleinanzeigen-Sync (manuell für MVP, automatisiert in Phase 2). Erfolgsbildschirm mit Inserat-Link, geteilter Vorlage für WhatsApp/Mail und Vorschau auf das optionale Besichtigungs-Tutorial.
- **Hauptaktion:** Ein-Klick-Veröffentlichung mit Confetti.
- **Datenfluss:** `listings.status = 'aktiv'`, `listings.veroeffentlicht_am = NOW()`. `wizard_progress.abgeschlossen_am = NOW()`.
- **Eingeklappter Hinweis:** Kein Tipp-Aufklapper — der Erfolgsbildschirm steht für sich.

---

## 5. Optionales Folge-Tutorial: Erste Besichtigung

Direkt nach Station 12 wird angeboten: „Möchtest du auch beim Thema Besichtigungen geführt werden?". Dieses zweite Tutorial ist deutlich kürzer (5 Stationen) und nutzt CRM und Termine.

- **B1 — Erste Anfrage einsortieren:** Anfrage aus dem öffentlichen Kontaktformular kommt rein, Nutzer lernt im CRM zu arbeiten.
- **B2 — Vorqualifizierung:** Welche Fragen stellt man Interessenten am Telefon? Klara liefert einen Gesprächsleitfaden.
- **B3 — Termin anlegen:** Erstes Termin-Anlegen im Kalender mit iCal-Versand.
- **B4 — Vor Ort:** Checkliste was man zur Besichtigung mitbringt (Energieausweis, Grundriss, Personalausweis-Notiz für Vorqualifizierung).
- **B5 — Nachbereitung:** Status im CRM aktualisieren, Eindruck festhalten, KI-Score interpretieren.

Auch dieses Tutorial ist optional und kann beliebig pausiert oder verlassen werden.

---

## 6. UI-Spezifikation

### 6.1 Layout-Aufbau (Fullscreen)

- **Header (60 px hoch):** Logo links, Schritt-Zähler & „Wizard verlassen" rechts.
- **Fortschrittsbalken (40 px hoch):** 12 Segmente, abgeschlossene grün gefüllt, aktuelles dunkelgrün, kommende grau. Darunter 4 Phasen-Labels.
- **Hauptbereich:** max. 580 px breit, zentriert, großzügiger Whitespace. Schritt-Nummer (klein, uppercase) → Titel (22 px) → kurze Beschreibung (14 px) → Hauptaktion.
- **Tipp-Aufklapper:** als `<details>`-Element direkt unter der Hauptaktion. Standardmäßig zugeklappt, dezent grau.
- **Footer (64 px hoch):** Zurück links · „Frage an Klara" + „Weiter →" rechts. Weiter-Button in Akzentgrün `#1B6B45`, leicht erhöht.

### 6.2 Designsystem-Bezug

Strikt gemäß `DESIGN.md`. Akzentfarbe `#1B6B45` für Fortschrittsbalken und Weiter-Button. Inter Font in 500/600/700. Keine zusätzlichen Farben einführen — der Wizard soll sich anfühlen wie das Dashboard, nur fokussierter.

### 6.3 Klara-Slide-Over

Klick auf „Frage an Klara" öffnet ein Slide-Over von rechts (480 px breit). Innerhalb des Slide-Overs läuft die bestehende Klara-Logik mit einer station-spezifischen System-Prompt-Erweiterung („Der Nutzer ist gerade in Station X — Energieausweis. Hilf ihm dabei.").

### 6.4 Mobile

Mobile First. Auf < 768 px wird der Hauptbereich auf 100 % Breite gesetzt. Fortschrittsbalken bleibt voll sichtbar, Phasen-Labels werden auf das aktuelle reduziert. Footer-Buttons gleich groß und tap-freundlich (mind. 44 px Höhe).

---

## 7. Datenmodell

### 7.1 Neue Tabelle `wizard_progress`

Spalten:

- `id` (uuid, PK)
- `user_id` (uuid, FK auf `users`)
- `aktuelle_station` (int, 1–12)
- `station_status` (jsonb) — pro Station: `{ status: 'open' | 'completed' | 'skipped', skip_reason?: string }`
- `wizard_profile` (jsonb) — Antworten aus Station 1
- `gestartet_am` (timestamp)
- `abgeschlossen_am` (timestamp, nullable)
- `zuletzt_aktiv_am` (timestamp)

Row Level Security: Nutzer sieht nur die eigene Zeile. Eine Zeile pro Nutzer.

### 7.2 Erweiterungen bestehender Tabellen

- `listings.lage_daten` (jsonb, nullable) — Cache der `MarketDataProvider`-Antwort
- `listings.energieausweis_status` (text) — Werte: `vorhanden` | `bestellt` | `nachzureichen`

### 7.3 `MarketDataProvider` Interface

Vertrag (vereinfacht):

```ts
interface MarketDataProvider {
  getMarketEstimate(adresse: Adresse, eckdaten: Eckdaten): Promise<{
    wert: number;
    spanne: [number, number];
    begründung: string;
    vergleichsobjekte: Vergleichsobjekt[];
  }>;

  getNeighborhoodData(adresse: Adresse): Promise<{
    lage_score: number;
    geräusch_db: number;
    infrastruktur: InfrastrukturItem[];
    vergleichsangebote: Angebot[];
  }>;
}
```

Implementierungen: `PricehubbleProvider`, `SprengnetterProvider`, `ValueAGProvider`, `FallbackProvider` (Claude + OSM). Auswahl via ENV `MARKET_DATA_PROVIDER`. Bei Provider-Fehler automatisches Fallback.

---

## 8. Umsetzungs-Roadmap

### Sprint 1 — Skelett (Woche 1)

- Route `/dashboard/start` mit Fullscreen-Layout (Header + Fortschrittsbalken + Footer).
- Tabelle `wizard_progress` + RLS.
- Basis-State-Machine: Station vor/zurück, Skip, Pause/Resume.
- Onboarding-Modal mit den 3 Quiz-Fragen.

### Sprint 2 — Daten-Stationen (Woche 2)

- Stationen 1, 2, 3 (Profil, Eckdaten, Grunddaten) live — schreiben in `users` + `listings`.
- Wiedereinstiegs-Banner im Dashboard.
- Sidebar-Eintrag „Geführter Modus".

### Sprint 3 — Marktdaten (Woche 3)

- `MarketDataProvider`-Interface mit `FallbackProvider` implementiert.
- Stationen 4 + 5 live.
- Pricehubble/Sprengnetter-Adapter als Stub vorbereitet — Aktivierung sobald Vertrag steht.

### Sprint 4 — Inserat-Stationen (Woche 4)

- Stationen 6, 7, 8, 9, 10 live.
- Energieausweis-Partner-iFrame integriert (sobald Partner steht).
- Klara-Slide-Over mit station-spezifischen System-Prompts.

### Sprint 5 — Live gehen (Woche 5)

- Stationen 11 + 12 live, Validierungs-Engine.
- Erfolgsbildschirm + Tutorial-Übergang.
- Mobile QA über alle 12 Stationen.

### Sprint 6 — Besichtigungs-Tutorial (Woche 6)

- 5 Stationen B1–B5 live.
- End-to-End-Test mit echtem Verkäufer aus Netzwerk.

---

## 9. Offene Fragen & Entscheidungen

- **Marktdaten-Provider:** Welcher Anbieter setzt sich durch? Pricehubble (Meeting nächste Woche), Value AG, Sprengnetter angefragt. Wizard-Architektur ist Provider-agnostisch — Entscheidung kann offen bleiben bis nach den Meetings.
- **Energieausweis-Partner:** Konkreter Partner für iFrame-Integration steht noch nicht (Stand `brain.md`). Bis dahin nur Upload + Skip-Pfad live, Bestellpfad als Coming-Soon.
- **Tier-Gating:** Soll der Wizard tier-abhängig Inhalte zeigen? Vorschlag — Inhalte gleich für alle Tiers, aber bei Premium-only Aktionen (KI-Bildverbesserung, Portal-Sync) wird auf bestehendes Tier-Gating der Module zurückgegriffen — kein eigenes Locking im Wizard.
- **Statische Checkliste `/dashboard/schritte`:** Bleibt sie parallel als „klassische Ansicht" erhalten oder wird sie durch den Wizard ersetzt? Empfehlung — erst entfernen wenn Wizard 4 Wochen stabil im Live-Betrieb ist.
- **Analytics:** Welche Wizard-Metriken tracken? Vorschlag — Drop-off pro Station, Skip-Quote pro skipbare Station, durchschnittliche Bearbeitungsdauer pro Station, Conversion vom Onboarding-Modal-Ja zum Live-Inserat.

---

> PRD Geführter Wizard v1.0 · dubistdermakler.de · Mai 2026 · Vertraulich · Nico + Kollege
