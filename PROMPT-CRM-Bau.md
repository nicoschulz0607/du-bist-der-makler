# Claude Code Auftrag: CRM-Lite + Besichtigungs-Kalender

## Kontext

Du arbeitest am Repo von **du-bist-der-makler.de** — einer Plattform für privaten Immobilienverkauf. Im Dashboard existieren bereits funktionierende Bereiche (Mein Objekt, KI-Exposé, KI-Preisrechner, KI-Bildverbesserung). Diese sind dein Vorbild für Code-Style, Komponenten-Patterns, Server-Actions, Supabase-Queries und Design.

Zwei Bereiche im Dashboard sind aktuell nur Stubs ("Feature in Entwicklung") und sollen jetzt vollständig gebaut werden:

1. **Interessenten-CRM** (`/dashboard/interessenten`)
2. **Besichtigungs-Kalender** (`/dashboard/termine` oder `/dashboard/besichtigungen`)

Die fachliche Spezifikation liegt in **`PRD-update-v1.1-crm.docx`** (Repo-Root oder /docs). **Lies dieses Dokument als ersten Schritt vollständig.** Dort sind CRM-01 bis CRM-04 sowie die Kalender-Anforderungen detailliert beschrieben.

---

## Phase 0 — Pflicht-Lesephase BEVOR du irgendwas schreibst

Tu in dieser Reihenfolge:

1. **Lies `PRD-update-v1.1-crm.docx`** komplett. Das ist die Wahrheit über das WAS.
2. **Lies `DESIGN.md`** im Repo-Root. Das ist die Wahrheit über das WIE-ES-AUSSIEHT.
3. **Lies `brain.md`** im Repo-Root für den größeren Kontext.
4. **Inspiziere bestehende Dashboard-Bereiche** im Code:
   - Wie sind Server-Actions strukturiert? (Datei-Layout, Naming, Error-Handling)
   - Wie werden Supabase-Queries gemacht? (Client vs. Server, RLS-Annahmen)
   - Welche UI-Komponenten existieren bereits? (Buttons, Inputs, Tabellen, Modals, Cards)
   - Welche Tailwind-Klassen-Patterns werden für Listenansichten und Detailseiten verwendet?
   - Wie ist Auth/Session-Handling gelöst?
   - Welcher Form-Handling-Ansatz wird genutzt? (react-hook-form? Server Actions mit FormData? Zod?)
   - Gibt es bereits eine `lib/anthropic.ts` oder ähnliches für Claude API Calls?
   - Wie wird Resend angesteuert für die KI-Exposé-Emails (falls vorhanden)?

5. **Schreibe deinen Plan in eine Datei** `PLAN-CRM.md` im Repo-Root, BEVOR du Code änderst:
   - Welche Patterns aus dem bestehenden Code übernimmst du?
   - Welche neuen Komponenten brauchst du?
   - In welcher Reihenfolge baust du?
   - Welche Datei-Struktur planst du?
   
   Halte hier inne und warte ggf. auf Freigabe — falls du Unsicherheiten hast, frag explizit nach. Wenn der Plan offensichtlich passt, mach weiter.

**Verbot:** Erfinde keine eigenen Datenbank-Schemas, keine eigenen Komponenten-Strukturen, keinen eigenen Styling-Ansatz, wenn das Repo bereits Konventionen hat. Halte dich an das, was da ist. Wenn du unsicher bist, ob ein Pattern schon existiert — grep zuerst.

---

## Bau-Reihenfolge (zwingend in dieser Reihenfolge)

### Schritt 1 — Datenbank-Migrationen

Erweitere die Supabase-DB. **Schreibe SQL-Migration-Dateien**, führe sie nicht direkt aus.

**Tabelle `interessenten` erweitern um folgende Spalten** (alle nullable außer wo angegeben):

```
-- Stufe 1 (vorhanden — nur prüfen): id, listing_id, name, email, telefon, 
-- nachricht, status, notizen, created_at

-- Quelle der Anfrage
quelle text  -- 'eigene_seite' | 'immoscout' | 'kleinanzeigen' | 'manuell'

-- Stufe 2: Vorqualifizierung
altersgruppe text                       -- '20-30' | '30-40' | '40-50' | '50-60' | '60+'
haushalt text                           -- 'single' | 'paar' | 'familie_1_kind' | 'familie_2_kinder' | 'familie_3_plus'
beruf text
wohnsituation_aktuell text              -- 'miete' | 'eigentum' | 'bei_eltern' | 'sonstiges'
finanzierung_status text                -- 'eigenkapital_vorhanden' | 'bank_vorpruefung' | 'finanzierung_laeuft' | 'nicht_geklaert' | 'barzahler'
eigenkapital_range text                 -- '<50k' | '50-100k' | '100-200k' | '200k+' | 'unbekannt'
zeithorizont text                       -- 'sofort' | '1-3_monate' | '3-6_monate' | '6+_monate' | 'flexibel'
motivation text                         -- Freitext
andere_objekte_besichtigt text          -- Freitext
eindruck_erstgespraech text             -- Freitext

-- Stufe 3: Besichtigung
eindruck_nach_besichtigung text         -- Freitext
reaktion_auf_preis text                 -- Freitext
bedenken text                           -- Freitext

-- Stufe 4: Entscheidung
abgegebenes_angebot numeric
bewertung_stars int CHECK (bewertung_stars BETWEEN 1 AND 5)

-- Status-Enum erweitern (falls bestehender Status-Spalte ein Enum ist)
-- Werte: 'neu' | 'vorqualifiziert' | 'besichtigung_geplant' | 'besichtigt' | 
--        'angebot_abgegeben' | 'verhandlung' | 'zugesagt' | 'abgesagt'

-- KI-Score-Felder (für CRM-03)
ki_score int CHECK (ki_score BETWEEN 1 AND 10)
ki_ampel text                           -- 'gruen' | 'gelb' | 'rot'
ki_begruendung text
ki_klaerungsfragen text[]
ki_red_flags text[]
ki_score_aktualisiert_am timestamptz
ki_score_basis_felder int               -- wieviele der 9 relevanten Felder waren gesetzt
```

**Tabelle `termine` erweitern:**

```
ical_uid uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE
notiz_nach_termin text
erinnerung_24h_versendet boolean DEFAULT false NOT NULL
```

> Die bestehende `termine`-Tabelle hatte laut altem PRD eine 1:1-Verknüpfung über `interessent_id`. Diese Spalte **entfernen** (oder zumindest depreciaten und ignorieren) — die Many-to-Many-Beziehung läuft jetzt über die neue Junction-Tabelle.

**Neue Tabelle `termine_interessenten` (Junction für Gruppenbesichtigungen):**

```sql
CREATE TABLE termine_interessenten (
  termin_id uuid NOT NULL REFERENCES termine(id) ON DELETE CASCADE,
  interessent_id uuid NOT NULL REFERENCES interessenten(id) ON DELETE CASCADE,
  eingeladen_per_mail boolean DEFAULT false NOT NULL,
  zugesagt boolean,
  erschienen boolean,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (termin_id, interessent_id)
);
```

**RLS-Policies für alle neuen/geänderten Spalten und die neue Tabelle**: Verkäufer darf nur Daten zu seinen eigenen Listings sehen/ändern. Halte dich exakt an das Policy-Pattern, das im Repo schon für `interessenten` und `termine` existiert.

**Indizes**: 
- `interessenten.listing_id` (sollte existieren, prüfen)
- `interessenten.status` (für Filter)
- `termine.datum, listing_id` (für Kalenderansicht)
- `termine_interessenten.interessent_id` (Reverse-Lookup)

Nach dem Schreiben der Migration: führe sie auf der lokalen/Dev-Supabase aus und committe sie.

### Schritt 2 — CRM-01: Interessenten-Profile

**Route**: `/dashboard/interessenten`

**Übersichtsseite**:
- Tabelle mit Spalten: Name, Status (als Badge), KI-Ampel (🟢🟡🔴 Symbol), letzter Kontakt (Datum), Quelle, Aktionen
- Filter: Status (Multi-Select), KI-Ampel (Multi-Select)
- Sortierung: Default neueste zuerst, klickbare Header
- "Neuen Interessenten anlegen"-Button (öffnet Modal oder neue Seite — orientiere dich am Pattern, das im Dashboard schon da ist)
- "CSV exportieren"-Button (alle aktuell gefilterten Interessenten)
- Klick auf Zeile → Detailseite

**Detailseite** `/dashboard/interessenten/[id]`:
- Vier visuell klar getrennte Sektionen (z.B. als Cards oder Accordion):
  1. **Stufe 1 — Erstkontakt**: alle Felder, viele schreibgeschützt wenn aus Kontaktformular gekommen
  2. **Stufe 2 — Vorqualifizierung**: alle Felder als Form, alle optional
  3. **Stufe 3 — Besichtigung**: zeigt verknüpfte Termine aus `termine` (Liste mit Datum, Uhrzeit, Status), plus die nach-Termin-Felder (eindruck_nach_besichtigung, reaktion_auf_preis, bedenken) — nur sichtbar wenn mindestens ein Termin existiert
  4. **Stufe 4 — Entscheidung**: Status-Dropdown, Angebot in Euro, Sterne-Bewertung, Notizen
- Speichern: Server Action mit optimistic update wenn dein Repo das Pattern hat, sonst klassischer Form-Submit mit Erfolg/Fehler-Toast
- Alle Felder sind optional. Validierung nur auf Format (Email, Telefon, Zahl)
- Oben rechts: "Status ändern"-Quick-Action

**AGG-Compliance**: Felder zu Religion, Herkunft, Nationalität, sexueller Orientierung **NICHT** anlegen. Auch nicht "auf Wunsch" oder als optionales Feld. Nicht erheben heißt nicht erheben.

**Akzeptanzkriterien Schritt 2**:
- [ ] Übersicht zeigt mindestens 5 Beispiel-Interessenten korrekt
- [ ] Filter funktionieren, Kombinationen auch
- [ ] CSV-Export liefert valide CSV-Datei
- [ ] Detailseite speichert alle Stufen ohne Datenverlust
- [ ] Manuelles Anlegen eines neuen Interessenten funktioniert ohne Fehler
- [ ] RLS: anderer User sieht keine fremden Interessenten (manuell testen)

### Schritt 3 — CRM-02: Besichtigungs-Kalender

**Route**: `/dashboard/termine` (oder bestehender Pfad — orientiere dich am Sidebar-Eintrag)

**Wochenansicht** (Default):
- 7 Spalten Mo-So
- Zeit-Achse 8:00 bis 20:00 in 30-Min-Slots
- Termine als Blöcke (Akzentfarbe `#1B6B45`, transparent für andere Termine)
- Klick auf leeren Slot → Termin-Modal
- Klick auf existierenden Termin → Detail-Modal mit Bearbeiten/Absagen
- Vor/Zurück/Heute-Navigation oben

**Listenansicht** (Toggle):
- Chronologische Liste aller zukünftigen Termine
- Vergangene Termine ausgeklappbar darunter

**Termin-Modal (Erstellen)**:
- Datum (Date-Picker, vorausgefüllt aus Slot-Klick)
- Uhrzeit von / bis (Default 30 Min Dauer)
- **Multi-Select Interessenten**: Suchfeld mit Live-Filter über Namen aus `interessenten`-Tabelle (nur eigene Listings), Mehrfachauswahl
- Bei Auswahl: Chip mit Name + (X zum Entfernen). Email/Telefon werden im Hintergrund mitgenommen, müssen nicht erneut eingegeben werden
- Notiz-Feld (Freitext, optional)
- Checkbox "Einladung per E-Mail senden" (Default: an)
- Speichern-Button

**Beim Speichern**:
1. INSERT in `termine`
2. INSERT in `termine_interessenten` für jeden ausgewählten Interessenten (mit `eingeladen_per_mail = true` falls Checkbox an)
3. Status der ausgewählten Interessenten auf `besichtigung_geplant` setzen (falls vorher `neu` oder `vorqualifiziert`)
4. Wenn Checkbox aktiv: für jeden Interessenten eine personalisierte E-Mail via Resend versenden (siehe iCal-Anforderungen unten)

**Termin bearbeiten**: 
- Wenn Datum/Uhrzeit/Adresse geändert wurden UND Einladung versendet war: erneut Mail versenden mit gleicher iCal-UID (das updated den Termin in den Empfänger-Kalendern automatisch — METHOD:REQUEST mit höherer SEQUENCE)
- Wenn Termin abgesagt wird: METHOD:CANCEL Mail versenden

**iCal-Generierung** (utility-Datei, z.B. `lib/ical.ts`):
- Eigene Implementierung, keine schwergewichtige Library nötig
- Pflicht-Felder: VERSION:2.0, PRODID, BEGIN:VEVENT, UID (= `termine.ical_uid`), DTSTAMP, DTSTART, DTEND, SUMMARY, DESCRIPTION, LOCATION, ORGANIZER, ATTENDEE, SEQUENCE, METHOD
- Test mit Outlook/Google/Apple Calendar dass die .ics-Datei richtig importiert wird
- Bei Update: SEQUENCE inkrementieren

**E-Mail-Inhalt (Einladung)**:
- Betreff: `Besichtigungstermin: [Adresse] am [Datum] um [Uhrzeit]`
- Body: persönliche Anrede, Termin, vollständige Objekt-Adresse, Hinweis "bitte Personalausweis mitbringen", Verkäufer-Vorname und Telefon für Rückfragen, kurzer Disclaimer zur Pünktlichkeit, Link zum Inserat
- Anhang: `.ics` mit der iCal-Datei

**Erinnerungs-System**:
- Cron-Job (Vercel Cron oder Supabase Edge Function) der täglich um z.B. 9:00 läuft
- Sucht alle Termine in den nächsten 24h, deren `erinnerung_24h_versendet = false`
- Sendet Reminder-Mail an Verkäufer ("Heute Besichtigung mit X um Y") und an alle Interessenten mit `eingeladen_per_mail = true`
- Setzt `erinnerung_24h_versendet = true`

**Status-Auto-Update nach Termin**:
- Cron-Job (gleicher Job oder zweiter, der täglich um 22:00 läuft) der Termine sucht die heute waren
- Setzt Status der zugehörigen Interessenten von `besichtigung_geplant` auf `besichtigt`
- (Kein Reminder an Verkäufer für Eindrucks-Eintrag im MVP — kann nachgezogen werden)

**Doppelbuchungs-Schutz**:
- Bei Speichern prüfen: gibt es bereits einen Termin im selben Zeitraum für dieses Listing?
- Wenn ja: Warnung anzeigen, aber erlauben (User könnte bewusst Gruppenbesichtigung machen wollen)

**Akzeptanzkriterien Schritt 3**:
- [ ] Wochenansicht rendert korrekt mit Beispieltermin
- [ ] Termin-Modal öffnet sich bei Slot-Klick mit vorausgefülltem Datum
- [ ] Multi-Select findet Interessenten via Live-Suche (auch bei 50+ Einträgen schnell)
- [ ] Speichern erstellt Termin + Junction-Einträge + sendet Mails (Mail im Resend-Dashboard sichtbar)
- [ ] iCal-Anhang importiert korrekt in Google Calendar (testen!)
- [ ] Status der Interessenten wird automatisch auf `besichtigung_geplant` gesetzt
- [ ] Cron-Job für 24h-Reminder funktioniert (lokal testen mit kurzfristigem Termin)
- [ ] Cross-Link funktioniert: vom Termin auf Interessenten-Detailseite, vom Interessenten auf Termin

### Schritt 4 — CRM-03: KI-Pre-Score

**Trigger**: Button "KI-Score holen" im Interessenten-Detailseite, sichtbar nur wenn Paket = pro oder premium

**Voraussetzung**: `finanzierung_status` UND `zeithorizont` müssen gesetzt sein. Sonst Button disabled mit Tooltip "Für eine sinnvolle Einschätzung bitte mindestens Finanzierungsstatus und Zeithorizont ausfüllen."

**Server Action** `lib/ai/scoreInterest.ts`:
- Lädt Interessenten-Daten + Listing-Daten (Preis, Größe, Lage, Zustand)
- Schickt Anfrage an Claude API (Sonnet, model-string aus env oder bestehendem `lib/anthropic.ts`)
- Parst die strukturierte JSON-Antwort
- Schreibt Ergebnis in die `ki_*`-Felder des Interessenten

**System-Prompt** (in `lib/ai/prompts/scoreInterest.ts`):

```
Du bist ein Vorqualifizierungs-Assistent für private Immobilienverkäufer in Deutschland. 
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
}
```

**User-Prompt-Template**:
```
Objekt:
- Typ: {objekttyp}
- Preis: {preis} €
- Wohnfläche: {wohnflaeche} m²
- Zimmer: {zimmer}
- Lage: {plz} {ort}
- Zustand: {zustand}

Interessent:
- Finanzierung: {finanzierung_status}
- Eigenkapital: {eigenkapital_range}
- Zeithorizont: {zeithorizont}
- Haushalt: {haushalt}
- Beruf (anonym, nur Branche): {beruf}
- Aktuelle Wohnsituation: {wohnsituation_aktuell}
- Motivation: {motivation}
- Andere besichtigte Objekte: {andere_objekte_besichtigt}
- Eindruck aus Erstgespräch: {eindruck_erstgespraech}
- Ursprüngliche Nachricht: {nachricht}

Bewerte diesen Interessenten nach den Regeln in deinem System-Prompt.
```

Felder die `null` oder leer sind: einfach mit `"keine Angabe"` ersetzen, NICHT herausfiltern — die KI muss wissen, was fehlt, damit sie die Confidence richtig einschätzt.

**UI-Anzeige des Scores**:
- Card im Interessenten-Detail mit: Score (große Zahl), Ampel-Badge, Begründung, Klärungsfragen als Liste, Red Flags als Warnung (rot) wenn vorhanden
- Confidence-Hinweis darunter: "Score basiert auf X von 9 möglichen Feldern. Ergänze Daten und hole einen neuen Score für höhere Genauigkeit."
- Disclaimer am Ende der Card: "KI-Einschätzung als Hilfsmittel. Die Entscheidung triffst du selbst."
- Re-generieren-Button (überschreibt vorherigen Score nach Bestätigung)

**Score in Übersichts-Tabelle**: Ampel-Symbol als kleiner farbiger Kreis. Tooltip beim Hover: aktueller Score.

**Akzeptanzkriterien Schritt 4**:
- [ ] Button disabled wenn Voraussetzungen nicht erfüllt, Tooltip korrekt
- [ ] API-Call funktioniert, Antwort wird geparst und gespeichert
- [ ] Card zeigt alle Score-Daten korrekt
- [ ] Re-Generierung überschreibt mit Bestätigungs-Dialog
- [ ] Ampel erscheint in Übersichts-Tabelle
- [ ] Bei nicht-Pro-Usern: Card komplett verborgen oder als Blur-Preview mit Upgrade-CTA (orientiere dich am Repo-Pattern)
- [ ] Test mit absichtlich problematischem Input: KI verweigert demografische Bewertung

### Schritt 5 — CRM-04: KI-Käufer-Empfehlung (NICHT JETZT BAUEN)

Nur als Stub anlegen mit "Coming Soon"-Text. Der wirkliche Bau erfolgt nach dem ersten echten Verkauf, weil wir reale Daten zum Validieren brauchen. Lege aber die Route `/dashboard/interessenten/empfehlung` schon an, damit die Sidebar konsistent ist.

---

## Allgemeine Regeln

### Code-Stil
- TypeScript strikt, keine `any`
- Server Components bevorzugt, Client Components nur wo nötig (Interaktivität)
- Server Actions für Mutations, kein eigener API-Layer wo nicht nötig
- Komponenten klein halten, eine Datei = ein Zweck
- Keine Comments wie `// dies ist eine Funktion` — Code muss selbsterklärend sein
- Deutsche UI-Texte, englische Code-Bezeichner (`fetchInteressenten`, nicht `holeInteressenten`)

### Design
- Akzentfarbe **immer** `#1B6B45`. Niemals andere Akzente einführen.
- Inter-Font, Spacing aus DESIGN.md, keine eigenen Schatten/Borders erfinden
- Mobile-tauglich, aber Desktop-First (Verkäufer sitzen am Schreibtisch)
- Bestehende UI-Komponenten wiederverwenden — keine Duplikate

### Tests / Validierung
- Nach jedem Schritt: lokal durchklicken und gegen die Akzeptanzkriterien checken
- Bei jedem Datenbank-Schreibvorgang: prüfen ob RLS korrekt greift (mit zweitem Test-User)
- Resend-Mails: erst gegen eigene Test-Adresse senden, nicht direkt produktiv
- Claude API Calls: Token-Verbrauch im Auge behalten, max_tokens vernünftig setzen

### Was du NICHT tust
- Keine Migrations direkt auf Production-Supabase ausführen — nur lokal/Dev
- Keine Stripe-Logik anfassen (separates Thema)
- Keine bestehenden Features umbauen ohne Rückfrage
- Kein Refactoring "weil es schöner wäre" — fokussiert bleiben
- Keine Tracking-/Analytics-Features einbauen
- Keine externen Libraries für triviale Dinge installieren (z.B. eigene Date-Helper statt date-fns falls nicht schon im Repo)

### Wenn du unsicher bist
- Frag nach. Konkrete Frage > falsche Annahme.
- Bei Konflikten zwischen PRD und bestehendem Code: Repo-Realität gewinnt, aber dokumentiere die Abweichung in `PLAN-CRM.md`

---

## Definition of Done für den gesamten Auftrag

- [ ] Alle Migrations committed und auf Dev-Supabase ausgeführt
- [ ] CRM-01 (Schritt 2) vollständig, alle Akzeptanzkriterien grün
- [ ] CRM-02 (Schritt 3) vollständig, alle Akzeptanzkriterien grün
- [ ] CRM-03 (Schritt 4) vollständig, alle Akzeptanzkriterien grün
- [ ] CRM-04 als "Coming Soon"-Stub vorhanden
- [ ] Keine TypeScript-Errors, keine ESLint-Errors
- [ ] Manuelle End-to-End-Tests: 1) Interessent anlegen, 2) Vorqualifizierungs-Daten ergänzen, 3) KI-Score holen, 4) Termin im Kalender erstellen mit diesem Interessenten, 5) Einladungs-Mail im Posteingang prüfen, 6) iCal-Anhang in Kalender importieren, 7) Termin bearbeiten und Update-Mail prüfen
- [ ] `PLAN-CRM.md` aktualisiert mit den tatsächlich getroffenen Entscheidungen (kann später für `brain.md` Update verwendet werden)
- [ ] Kurzes Changelog in `CHANGELOG.md` (oder Commit-History) das die Änderungen dokumentiert

Wenn alle Häkchen sitzen: melde "Done" mit einer Zusammenfassung der Datei-Änderungen und etwaiger offener Punkte.
