# Product Requirements Document (PRD) — du-bist-der-makler.de

> Version 1.0 · April 2026 · MVP-Phase
>
> Dieses Dokument definiert was gebaut wird, für wen, und wie es genau funktionieren soll. Es ist die Brücke zwischen brain.md (Vision) und Code. Bei jedem Zweifel beim Entwickeln: dieses Dokument hat die Antwort.

---

## 1. Produkt-Überblick

**Problem**
Private Immobilienverkäufer in Deutschland stehen vor einer schlechten Wahl: teurer Makler (3–6 % Provision) oder Listing-Plattform ohne jede Begleitung. Eine Lösung die professionelle Tools, echte Verkaufsbegleitung und einen fairen Festpreis kombiniert, existiert nicht.

**Lösung**
du-bist-der-makler.de ist eine SaaS-Plattform für privaten Immobilienverkauf mit KI-Tools, Schritt-für-Schritt-Begleitung und optionalem Makler-Support — für einen einmaligen Festpreis ohne Abo.

**Kern-Versprechen**
> Du zahlst einmal. Du verkaufst selbst. Wir begleiten dich dabei.

**Zielgruppe**
- Primär: Privatpersonen 35–60 Jahre, die eine Immobilie verkaufen möchten, technisch grundlegend affin sind und Provision sparen wollen
- Sekundär: Erben die ein geerbtes Objekt verkaufen müssen — unsicher, unter Zeitdruck
- Tertiär: Vermieter die eine Investitionsimmobilie veräußern

**Abgrenzung**
- Wir sind kein Makler — kein Maklervertrag, keine Provision, keine Vertretung
- Wir sind kein reines Listing-Portal — wir begleiten den gesamten Verkaufsprozess
- Wir sind kein Rechtsanwalt — KI-Chatbot gibt keinen Rechtsrat (Disclaimer Pflicht)

---

## 2. Paket-Übersicht

Alle Pakete laufen 6 Monate. Kein Abo. Keine automatische Verlängerung. Einmalrechnung nach Veröffentlichung.

| Feature | Starter 299 € | Pro 499 € | Premium 699 € |
|---|---|---|---|
| Listing auf du-bist-der-makler.de | ✓ | ✓ | ✓ |
| Schritt-für-Schritt Checkliste | ✓ | ✓ | ✓ |
| KI-Chatbot 24/7 | ✓ | ✓ | ✓ |
| Interessenten-Anfragen per E-Mail | ✓ | ✓ | ✓ |
| KI-Exposé-Generator (PDF) | — | ✓ | ✓ |
| KI-Preisrechner | — | ✓ | ✓ |
| CRM-Lite (Interessenten + Termine) | — | ✓ | ✓ |
| Energieausweis-Partner (Affiliate) | — | ✓ | ✓ |
| ImmoScout24 + Kleinanzeigen Listing | — | — | ✓ |
| KI-Bildverbesserung (Replicate API) | — | — | ✓ |
| Makler-Support (direkte Hotline) | — | — | ✓ |
| Makler-Stunde Add-on (50 €/h) | buchbar | buchbar | inklusive 1h |

> Upsell-Logik: Starter ist der Türöffner. Sobald Nutzer merken wie viel Arbeit ein Verkauf ist, upgraden die meisten auf Pro oder Premium. Feature-Flags im Dashboard zeigen gesperrte Features als Blur-Preview mit Upgrade-CTA.

---

## 3. Roadmap & Phasen

| Phase | Zeitraum | Lieferobjekte | Ziel |
|---|---|---|---|
| **MVP** | Woche 1–2 | Landing Page + Waitlist, Next.js Setup, Supabase Auth, Stripe Checkout | Erste zahlende Nutzer |
| **Alpha** | Monat 1 | Dashboard Grundgerüst, Listing erstellen, KI-Exposé-Generator, Checkliste | Erstes Objekt vollständig inseriert |
| **Beta** | Monat 2 | CRM-Lite, Interessenten-Verwaltung, Energieausweis-Partner, ImmoScout-Listing | 5 echte Verkäufer onboarden |
| **Launch** | Monat 3 | KI-Bildverbesserung, Makler-Stunde buchbar, SEO-Grundlage, Public Launch | Öffentlicher Launch + erste 20 Kunden |

> Prioritäten: P0 = MVP-Blocker (ohne das kein Launch), P1 = wichtig für erste Nutzer, P2 = wertvoll aber verschiebbar. Alles P2 kommt nach dem ersten echten Nutzer-Feedback.

---

## 4. Feature-Anforderungen

### 4.1 Landing Page & Waitlist

---

#### LP-01 · Landing Page (Public) · [Starter] · [P0]

**User Story**
Als potenzieller Käufer besuche ich du-bist-der-makler.de und verstehe sofort was das Produkt ist, was es kostet und warum es besser als die Alternativen ist — und kann mich registrieren oder auf die Waitlist eintragen.

**Akzeptanzkriterien**
- Hero mit Headline, Subline und zwei CTAs (Jetzt starten + Mehr erfahren)
- 3-Schritte-Erklärung (So funktioniert's)
- Pricing-Tabelle mit allen 3 Paketen, Empfehlungs-Badge auf Pro
- Vergleichs-Sektion (wir vs. Makler vs. ohne-makler.net)
- FAQ mit mind. 5 Fragen (inkl. ImmoScout-Frage, Energieausweis, Laufzeit)
- Waitlist-Formular (E-Mail + Vorname) mit Supabase-Speicherung
- Footer: Impressum, Datenschutz, AGB Links (Seiten müssen existieren)
- Mobile-optimiert (< 768px vollständig nutzbar)
- Core Web Vitals: LCP < 2.5s, keine Layout Shifts

**Out of Scope (MVP)**
- Blog / Content-Bereich (kommt in Phase 2)
- Mehrsprachigkeit (DE only für MVP)
- Chat-Widget auf der Landing Page

> **Hinweis:** DESIGN.md im Repo-Root verwenden. Inter-Font, Akzentfarbe #1B6B45, Airbnb-Spacing-System.

---

#### LP-02 · Auth: Registrierung & Login · [Starter] · [P0]

**User Story**
Als neuer Nutzer kann ich mich mit E-Mail + Passwort registrieren und einloggen. Nach dem Login werde ich zum Onboarding weitergeleitet.

**Akzeptanzkriterien**
- Registrierung via Supabase Auth (E-Mail + Passwort)
- E-Mail-Bestätigung Pflicht vor erstem Login
- Login-Seite mit Passwort-Vergessen-Funktion
- Nach Login: Weiterleitung zu /onboarding wenn kein aktives Paket, sonst /dashboard
- Session bleibt 30 Tage aktiv (Supabase default)
- Fehler klar kommuniziert: 'E-Mail bereits vergeben', 'Falsches Passwort' etc.

**Out of Scope (MVP)**
- Google / Social Login (kommt später)
- 2-Faktor-Authentifizierung (nicht im MVP)

---

#### LP-03 · Onboarding: Paket wählen + Stripe Checkout · [Starter] · [P0]

**User Story**
Als registrierter Nutzer wähle ich mein Paket und bezahle einmalig per Stripe. Nach erfolgreicher Zahlung bin ich im Dashboard mit dem entsprechenden Paket freigeschaltet.

**Akzeptanzkriterien**
- Paket-Auswahl-Screen mit allen 3 Paketen (gleiche Darstellung wie Landing Page Pricing)
- Klick auf Paket → Stripe Checkout (hosted, kein Custom UI für MVP)
- Nach Zahlung: Webhook setzt paket_tier in Supabase users-Tabelle
- Erfolgs-Screen: 'Glückwunsch, du bist jetzt dabei!' + Weiterleitung Dashboard
- Abbruch: zurück zur Paket-Auswahl, keine Buchung gespeichert
- Stripe Produkte: 3 einmalige Produkte (299 / 499 / 699 €) + 1 Add-on (50 €/h)

**Out of Scope (MVP)**
- Upgrade-Flow innerhalb des Dashboards (kommt in Phase 2 — für MVP: Support kontaktieren)
- Ratenzahlung, Gutscheine (später)

> **Hinweis:** Stripe Webhook: `checkout.session.completed` → `update users SET paket_tier = X WHERE stripe_customer_id = Y`

---

### 4.2 Listing erstellen & verwalten

---

#### LIST-01 · Objekt-Formular (Listing erstellen) · [Starter] · [P0]

**User Story**
Als Nutzer kann ich meine Immobilie durch ein strukturiertes Formular erfassen und als Listing veröffentlichen.

**Akzeptanzkriterien**
- Formular-Felder: Objekttyp (Haus/Wohnung/Grundstück), Adresse (PLZ + Ort + Straße), Wohnfläche (m²), Zimmer, Baujahr, Zustand, Ausstattung (Checkboxen), Beschreibung (Freitext max. 2000 Zeichen), Preis, Energieausweis-Klasse
- Foto-Upload: min. 5, max. 30 Fotos (JPEG/PNG, max. 10 MB pro Foto) via Supabase Storage
- Grundriss-Upload: optional, 1 Datei (PDF oder Bild)
- Formular speichert als Draft — Nutzer kann jederzeit weitermachen
- Validierung: Pflichtfelder markiert, klare Fehlermeldungen inline
- Preview: Nutzer sieht Vorschau des Inserats vor Veröffentlichung
- Veröffentlichen-Button: Listing status = 'aktiv', öffentlich sichtbar auf /inserate/[id]
- Bearbeiten jederzeit möglich solange Laufzeit aktiv

**Out of Scope (MVP)**
- Video-Upload (kommt mit Premium Phase 2)
- 360°-Rundgang (kein MVP)
- Mehrere Objekte pro Account (MVP: 1 Objekt pro Account)

> **Hinweis:** Fotos in Supabase Storage unter `/listings/{user_id}/{listing_id}/`. Öffentliche URLs für die Anzeige.

---

#### LIST-02 · Öffentliche Inserat-Seite · [Starter] · [P0]

**User Story**
Als Kaufinteressent kann ich ein Inserat auf du-bist-der-makler.de aufrufen und alle relevanten Informationen sowie ein Kontaktformular sehen.

**Akzeptanzkriterien**
- URL-Struktur: `/inserate/[slug]` (slug = ID + Ortsname)
- Anzeige: alle Formular-Felder, Foto-Galerie (Vollbild-fähig), Grundriss, Preis prominent
- Kontaktformular: Name, E-Mail, Telefon (optional), Nachricht — Absenden leitet E-Mail an Verkäufer weiter (via Resend)
- Kein Login für Interessenten nötig
- SEO: title-Tag, meta description, Open Graph Bild (erstes Foto)
- Mobile-optimiert
- Energieausweis-Klasse als Badge anzeigen

**Out of Scope (MVP)**
- Direkt-Chat zwischen Interessent und Verkäufer (kommt mit CRM-Lite)
- Merkliste / Favoriten für Interessenten
- Karte / Kartenansicht (kein MVP)

---

### 4.3 KI-Tools

---

#### KI-01 · KI-Exposé-Generator · [Pro] · [P0]

**User Story**
Als Pro/Premium-Nutzer kann ich aus meinen Listing-Daten und Fotos ein professionelles Exposé als PDF generieren lassen — ohne selbst einen Text schreiben zu müssen.

**Akzeptanzkriterien**
- Trigger: Button 'Exposé generieren' im Dashboard (nur sichtbar bei Pro+)
- Input: alle Listing-Felder werden automatisch übergeben (kein erneutes Eingeben)
- Claude API Call: strukturierter Prompt mit allen Objektdaten → Exposé-Text
- Output: formatiertes PDF mit Titelseite, Objektbeschreibung, Ausstattungs-Liste, Lagebeschreibung (aus PLZ generiert), Anbieter-Kontaktdaten, Haftungsausschluss
- PDF-Generierung: via puppeteer oder @react-pdf/renderer
- Nutzer kann Text vor PDF-Export bearbeiten (einfaches Textarea-Edit)
- Download-Button: direkter PDF-Download
- Re-Generierung möglich (überschreibt vorheriges Exposé)
- Ladezeit-Feedback: Spinner mit 'Exposé wird erstellt...' (ca. 10–20 Sekunden)

**Out of Scope (MVP)**
- Mehrsprachige Exposés (DE only für MVP)
- Branding des Exposés anpassen
- Exposé direkt per E-Mail versenden aus dem Tool

> **Hinweis:** Claude Prompt Struktur: System-Prompt definiert Ton (professionell, warm, keine Übertreibungen). User-Prompt enthält alle Objektdaten als JSON. Output soll reines HTML sein das zu PDF gerendert wird.

---

#### KI-02 · KI-Preisrechner · [Pro] · [P1]

**User Story**
Als Pro/Premium-Nutzer erhalte ich eine KI-gestützte Marktwert-Einschätzung meiner Immobilie basierend auf Lage, Größe, Zustand und Baujahr.

**Akzeptanzkriterien**
- Input-Formular: PLZ, Wohnfläche, Zimmer, Baujahr, Zustand (1–5 Skala), Objekttyp
- Claude API: Prompt mit Vergleichsmarkt-Kontext → Preisspanne (von X bis Y €)
- Output: geschätzte Preisspanne, Hinweis auf Faktoren die den Preis beeinflussen, Disclaimer
- Ergebnis bleibt gespeichert und ist im Dashboard abrufbar
- Nicht-Pro Nutzer sehen die Funktion als gesperrte Blur-Preview mit Upgrade-CTA

**Out of Scope (MVP)**
- Echte Marktdaten-API-Integration (Claude schätzt aus Trainingsdaten)
- PDF-Export der Bewertung
- Historien-Vergleich

> **Hinweis:** Disclaimer Pflicht: "Diese Einschätzung ist eine KI-Schätzung und ersetzt keine professionelle Immobilienbewertung. Sie dient als erste Orientierung."

---

#### KI-03 · KI-Chatbot 24/7 · [Starter] · [P1]

**User Story**
Als Nutzer kann ich jederzeit Fragen zum Verkaufsprozess stellen und erhalte sofortige, hilfreiche Antworten — ohne auf Support-Öffnungszeiten warten zu müssen.

**Akzeptanzkriterien**
- Chat-Widget im Dashboard (unten rechts, immer sichtbar)
- Claude API: System-Prompt definiert den Chatbot als 'Verkaufs-Assistent' — hilft bei Prozessfragen, gibt keine Rechtsberatung
- Typische Fragen: Energieausweis-Pflicht, Notarkosten, Besichtigungstipps, Preisverhandlung
- Wenn Rechtsrat gefragt: Standard-Antwort 'Für rechtliche Fragen empfehlen wir einen Notar oder Anwalt'
- Chatverläufe werden nicht dauerhaft gespeichert (session-only für MVP)
- Disclaimer sichtbar im Chat-Header: 'Kein Rechtsrat — nur allgemeine Informationen'

**Out of Scope (MVP)**
- Chatbot-Verlauf dauerhaft speichern und durchsuchen
- Chatbot kann Termine buchen oder Formulare ausfüllen
- Integration mit externen Rechtsdatenbanken

---

#### KI-04 · KI-Bildverbesserung · [Premium] · [P2]

**User Story**
Als Premium-Nutzer kann ich Fotos meiner Immobilie automatisch aufwerten lassen — hellere Räume, schärfere Details, professioneller Look.

**Akzeptanzkriterien**
- Button 'Fotos aufwerten' im Foto-Upload-Bereich (nur Premium)
- Replicate API Call: gewählte Fotos werden an Bildverbesserungs-Modell gesendet
- Nutzer kann Original und verbesserte Version vergleichen (Side-by-Side)
- Verbesserte Fotos können original ersetzen oder zusätzlich hinzugefügt werden
- Max. 20 Fotos pro Durchgang
- Ladezeit-Feedback pro Foto

**Out of Scope (MVP)**
- Virtuelle Möblierung
- Video-Verbesserung
- HDR-Komposition aus mehreren Aufnahmen

> **Hinweis:** Replicate Model: real-esrgan oder vergleichbares Upscaling-Modell. Kosten ca. 0,01–0,05 € pro Bild.

---

### 4.4 CRM-Lite — Interessenten-Verwaltung

---

#### CRM-01 · Interessenten-Übersicht · [Pro] · [P1]

**User Story**
Als Pro/Premium-Nutzer sehe ich alle Interessenten die über das Kontaktformular angefragt haben in einer übersichtlichen Liste und kann ihren Status verwalten.

**Akzeptanzkriterien**
- Tabelle: Name, E-Mail, Telefon, Datum der Anfrage, Status (Neu / Kontaktiert / Besichtigung geplant / Abgesagt / Kaufinteressent)
- Status per Dropdown änderbar
- Notizfeld pro Interessent (Freitext, max. 500 Zeichen)
- Filter: nach Status, nach Datum
- Sortierung: neueste zuerst (default)
- Neue Anfragen erscheinen automatisch
- CSV-Export der Interessenten-Liste

**Out of Scope (MVP)**
- E-Mail direkt aus dem CRM versenden
- Automatisierte Follow-up E-Mails
- Scoring / Ranking der Interessenten

---

#### CRM-02 · Besichtigungstermine · [Pro] · [P1]

**User Story**
Als Pro/Premium-Nutzer kann ich Besichtigungstermine für Interessenten planen und verwalten.

**Akzeptanzkriterien**
- Terminkalender im Dashboard: Wochenansicht + Listenansicht
- Termin erstellen: Datum, Uhrzeit, Dauer (default 30 Min), Interessent verknüpfen, optionale Notiz
- Termin per E-Mail bestätigen: Resend schickt Bestätigung an Interessenten
- Termin bearbeiten / absagen möglich
- Erinnerungs-E-Mail: 24h vor dem Termin an Verkäufer und Interessent
- Keine Doppelbuchungen möglich (Validierung)

**Out of Scope (MVP)**
- Calendly-Integration
- Automatische Terminvorschläge
- iCal / Google Calendar Export (kommt Phase 2)

---

### 4.5 Schritt-für-Schritt Checkliste

---

#### CHECK-01 · Verkaufs-Checkliste · [Starter] · [P0]

**User Story**
Als Nutzer aller Pakete sehe ich eine vollständige Checkliste die mich durch alle Schritte des Immobilienverkaufs führt — von der Vorbereitung bis zum Notartermin.

**Akzeptanzkriterien**
- 4 Phasen: 1) Vorbereitung, 2) Vermarktung, 3) Besichtigungen & Verhandlung, 4) Kaufabschluss
- Jede Phase enthält 5–10 konkrete Aufgaben mit kurzer Erklärung
- Aufgaben als Checkbox abhakbar — Status wird gespeichert (Supabase)
- Fortschrittsbalken zeigt Gesamtfortschritt in %
- Verlinkung zu relevanten Features: 'Energieausweis bestellen' → Partner-Link, 'Exposé erstellen' → KI-Exposé-Tool
- Komplett auf Deutsch, verständlich ohne Vorkenntnisse

**Out of Scope (MVP)**
- Individuelle Checkliste anpassen
- Erinnerungs-E-Mails für überfällige Aufgaben (Phase 2)

> **Hinweis:** Checklisten-Content ist statisch (hardcoded) für MVP. Kein CMS nötig.

---

### 4.6 Partner-Services & Add-ons

---

#### PART-01 · Energieausweis-Partner · [Starter] · [P1]

**User Story**
Als Nutzer kann ich direkt über du-bist-der-makler.de einen Energieausweis bestellen — weil er beim Verkauf gesetzlich vorgeschrieben ist.

**Akzeptanzkriterien**
- Partner-Link im Dashboard und in der Checkliste (Affiliate-Link)
- Kurze Erklärung: 'Warum du einen Energieausweis brauchst' + Link zu Partner
- Affiliate-Tracking: UTM-Parameter oder Partner-ID im Link
- Hinweis: 'Pflicht beim Verkauf laut Energieeinsparverordnung'
- Preis-Indikation anzeigen: 'ab ca. 79 €'

**Out of Scope (MVP)**
- Energieausweis direkt auf unserer Plattform bestellen
- Eigener Energieausweis-Service

> **Hinweis:** Affiliate-Marge ca. 10–30 € pro Energieausweis. Partner vor Launch klären.

---

#### PART-02 · Makler-Stunde (Add-on) · [Starter] · [P1]

**User Story**
Als Nutzer aller Pakete kann ich eine 1-stündige Beratung mit dem Makler-Kollegen buchen wenn ich bei komplexen Fragen nicht weiterkomme.

**Akzeptanzkriterien**
- Buchungs-Button im Dashboard: 'Makler-Stunde buchen (50 €/h)'
- Klick → Calendly-Embed (oder Link zu externem Buchungstool des Kollegen)
- Stripe-Zahlung: 50 € einmalig vor dem Termin
- Bestätigungs-E-Mail mit Termin-Details via Resend
- Premium-Nutzer: erste Stunde inklusive (kein Stripe-Checkout, direkt Calendly)

**Out of Scope (MVP)**
- Eigenes Buchungssystem
- Pakete mit mehreren Stunden
- Video-Call direkt auf der Plattform

> **Hinweis:** MVP: Calendly-Link des Kollegen + Stripe Payment Link. Keine technische Integration nötig.

---

#### PART-03 · ImmoScout24 + Kleinanzeigen Listing · [Premium] · [P1]

**User Story**
Als Premium-Nutzer wird meine Immobilie auf ImmoScout24 und eBay Kleinanzeigen inseriert — ohne dass ich dort ein eigenes Konto brauche.

**Akzeptanzkriterien**
- Trigger: nach Paket-Kauf Premium und Listing-Veröffentlichung
- Manueller Prozess für MVP: Nico oder Kollege inserieren das Objekt manuell unter dem Makler-Account (600 €/Monat Flatrate)
- Nutzer sieht Status: 'ImmoScout-Listing: aktiv' + Link zum Inserat
- E-Mail-Benachrichtigung wenn Inserat live ist (manuell ausgelöst)
- Anfragen von ImmoScout werden per E-Mail an Verkäufer weitergeleitet

**Out of Scope (MVP)**
- Vollautomatische API-Integration ImmoScout
- Automatisches Synchronisieren von Änderungen

> **Hinweis:** MVP ist manuell — aber für den Nutzer fühlt es sich automatisch an. Ziel: innerhalb 24h nach Kauf live.

---

## 5. Tech Stack

| Bereich | Tool | Begründung |
|---|---|---|
| Frontend | Next.js + Tailwind | Server Components, App Router, optimale SEO-Basis |
| Styling | Tailwind CSS + DESIGN.md | Utility-first, konsistentes Token-System |
| Animation | GSAP (optional) | Für Landing Page Hero — nicht im Dashboard |
| Backend / DB | Supabase | Auth, Postgres DB, Storage (Fotos), Realtime für CRM |
| E-Mail | Resend | Transaktionale E-Mails, Interessenten-Forwarding |
| Payment | Stripe | Einmalzahlung + Add-on (Makler-Stunde 50 €) |
| KI — Exposé | Claude API (Sonnet) | Strukturierte Texterzeugung aus Formular-Inputs |
| KI — Chatbot | Claude API | 24/7 Fragen, kein Rechtsrat, Haftungsausschluss |
| KI — Preisrechner | Claude API | Marktwert-Schätzung aus Lage/Größe/Zustand |
| KI — Bilder | Replicate API | Ein API-Call, kein eigenes Modell |
| Hosting | Vercel | Zero-Config Next.js Deploy, Preview-URLs |
| Automatisierung | n8n (Hetzner selfhosted) | Onboarding-Flows, E-Mail-Sequenzen, Webhooks |

### Datenbankstruktur (Supabase — Kern-Tabellen)

```sql
users:            id, email, paket_tier (starter/pro/premium), stripe_customer_id, created_at
listings:         id, user_id, status (draft/aktiv/verkauft), alle Formular-Felder, created_at, updated_at
interessenten:    id, listing_id, name, email, telefon, nachricht, status, notizen, created_at
termine:          id, listing_id, interessent_id, datum, uhrzeit, dauer_min, notiz, status
checkliste_status: id, user_id, aufgabe_id, completed, completed_at
```

---

## 6. Seitenstruktur (Next.js App Router)

**Public (ohne Login)**
- `/` → Landing Page
- `/login` → Login
- `/registrieren` → Registrierung
- `/inserate/[slug]` → Öffentliche Inserat-Seite
- `/impressum`, `/datenschutz`, `/agb` → Rechtliche Seiten (Pflicht vor Launch)

**Onboarding (nach Registrierung, vor Paket-Kauf)**
- `/onboarding` → Paket-Auswahl + Stripe Checkout

**Dashboard (nach Login + Paket-Kauf, geschützt)**
- `/dashboard` → Übersicht: Listing-Status, Checkliste-Fortschritt, letzte Aktivität
- `/dashboard/objekt` → Listing erstellen / bearbeiten
- `/dashboard/exposé` → KI-Exposé-Generator [Pro+]
- `/dashboard/preisrechner` → KI-Preisrechner [Pro+]
- `/dashboard/interessenten` → CRM-Lite [Pro+]
- `/dashboard/termine` → Besichtigungskalender [Pro+]
- `/dashboard/checkliste` → Schritt-für-Schritt Checkliste [alle]
- `/dashboard/partner` → Partner-Services [alle]
- `/dashboard/einstellungen` → Kontodaten, Passwort ändern, Rechnungen

> **Feature-Flags:** Gesperrte Bereiche sind sichtbar aber geblurred mit Upgrade-CTA. Nutzer sieht was er bekommt wenn er upgradet — kein leerer 404.

---

## 7. Nicht-funktionale Anforderungen

**Performance**
- Lighthouse Score: mind. 85 auf allen Seiten
- LCP (Largest Contentful Paint): < 2.5s auf Landing Page
- Foto-Upload: Fortschrittsbalken, kein Page-Freeze
- Claude API Calls: Ladeindikator immer sichtbar, Timeout bei > 30s mit Fehlermeldung

**Sicherheit**
- Row Level Security (RLS) in Supabase: Nutzer sieht nur eigene Daten
- Stripe Webhooks: Signatur-Validierung Pflicht
- Fotos: keine ausführbaren Dateien akzeptieren, nur JPEG/PNG/WEBP
- KI-Chatbot: Prompt Injection abwehren durch System-Prompt-Struktur

**DSGVO**
- Datenschutzerklärung vor Launch Pflicht
- Cookie-Banner: nur technisch notwendige Cookies ohne Banner, Analyse-Cookies mit Opt-in
- Recht auf Löschung: Account-Löschung löscht alle Daten (Supabase cascade delete)
- Auftragsverarbeitungsvertrag mit Supabase, Vercel, Resend, Stripe nötig

**Rechtliches (vor Launch Pflicht)**
- Impressum mit vollständigen Angaben
- Haftungsausschluss für KI-Chatbot und KI-Preisrechner prominent platziert
- AGB: Laufzeit, Zahlungsbedingungen, Kündigung, Haftungsbegrenzung
- Klar kommunizieren dass wir kein Makler sind und keine Provision verlangen

---

## 8. Offene Fragen & Entscheidungen

| Frage | Optionen | Deadline |
|---|---|---|
| ImmoScout-Flatrate: rechtlich sauber Objekte dritter Verkäufer unter Makler-Lizenz inserieren? | a) Ja erlaubt  b) Eigener Plattformvertrag nötig  c) Anwalt fragen | Vor Beta-Launch |
| Upgrade-Flow im Dashboard: Support-basiert oder Self-Service? | MVP: Support per E-Mail / Phase 2: Stripe Billing Portal | MVP: Support |
| Equity-Split Nico / Kollege: wie und wann formalisieren? | GbR sofort vs. informell bis erste Einnahmen vs. GmbH direkt | Vor erstem zahlenden Kunden |
| KI-Preisrechner: reicht Claude-Schätzung oder brauchen wir Marktdaten-API? | MVP: Claude-Schätzung mit Disclaimer / Phase 2: Sprengnetter oder Pricehubble API | Vor Pro-Launch |
| Energieausweis-Partner: wer konkret? | Klar Solar, Energie-Ausweis.de oder andere — Affiliate-Konditionen klären | Vor Beta |

---

*PRD v1.0 · du-bist-der-makler.de · April 2026 · Vertraulich · Nico + Kollege*