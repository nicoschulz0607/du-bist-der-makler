# 🏠 brain.md — du-bist-der-makler.de

> Letztes Update: Mai 2026
> Status: Konzeptphase / Pre-Launch

---

## 1. Vision

Eine Plattform für privaten Immobilienverkauf **ohne Makler** – aber mit allen Tools, die man braucht, um es professionell zu machen. Zwischen "ich stell's auf ImmoScout" und "ich beauftrage einen Makler" gibt es eine echte Lücke. Diese Lücke füllen wir.

**Kern-Versprechen:** Du zahlst einmal. Du verkaufst selbst. Wir begleiten dich dabei.

---

## 2. Markt & Wettbewerb

| Anbieter | Modell | Preis (ca.) | Schwäche |
|---|---|---|---|
| ImmoScout24 (Privat) | Listing-Portal | ab 199€/30 Tage | Teuer, kein Support, keine Verkaufsbegleitung |
| ohne-makler.net | Listing-Aggregator | 129€ (Immowelt-only) bis 399€ (3M, alle Portale) | Kein Support mehr, kein CRM, keine App, buggy Nachrichtensystem |
| Klassischer Makler | Provision | 3–6% des Kaufpreises | Sehr teuer, Kontrollverlust |
| Homeday / McMakler | Hybrid-Makler (Provision) | ~3,57% | Immer noch Provision, kein Festpreis |
| **du-bist-der-makler.de** | Pakete + KI-Tools + Makler-Backup | 129–869€ je nach Laufzeit | Noch unbekannt, kein Traffic |

### Unsere Positionierung gegenüber ohne-makler.net (präzise)

ohne-makler.net hat zwei separate 1-Monats-Pakete (Immowelt-only 129€, ImmoScout-only 149€) und größere Multi-Portal-Pakete. Wir matchen das so:

| Unser Paket | Vergleichbares ohne-makler.net Paket | Unser Mehrwert |
|---|---|---|
| **Basic (129€)** | ImmoScout-only (149€) | **20€ günstiger** — gleicher ImmoScout-Listing + KI-Chatbot + Checkliste |
| **Pro (169€)** | Bestseller (alle Portale) | Gleiche Reichweite + KI-Exposé + CRM + Bewertungs-Tool + Energieausweis |
| **Premium (219€)** | (kein Äquivalent — haben sie nicht) | Alle Pro-Features + echter Makler-Support — einzigartig im Markt |

**Marketing-Story:** "Bei vergleichbaren Paketen sind wir gleich teuer oder günstiger wie ohne-makler.net — bei uns gibt's aber zusätzlich KI-Tools und einen echten Makler im Hintergrund."

### Strukturelle Vorteile

- Kollege zahlt 600€/Monat Flatrate bei ImmoScout → unbegrenzte Inserate
- Break-Even: ~5 Premium-Kunden → danach reiner Gewinn auf diesem Kostenblock
- ohne-makler.net rechnet pro Inserat ab → wir haben dauerhaften Kostenvorteil

### Schwächen der Konkurrenz (aus echten Bewertungen)

- ohne-makler.net hat telefonischen Support abgeschafft → wir machen Support zum Kernfeature
- Nachrichten-System bei ohne-makler.net buggy
- Kein Anbieter hat eine App
- Kein Anbieter hat echte KI-Tools im Standard

---

## 3. Pricing (final)

Drei Pakete, drei Laufzeiten. Kein Abo. Keine automatische Verlängerung. Listing geht nach Ablauf offline, Daten bleiben für Reaktivierung gespeichert.

### Verkäufer-Pakete (Hauptprodukt)

| Paket | 1 Monat | 3 Monate | 6 Monate | Vergleichs-Rabatt |
|---|---|---|---|---|
| **Basic** | 129€ | 299€ | 499€ | 6M = 36% günstiger als 6×1M |
| **Pro** | 169€ | 399€ | 669€ | 6M = 34% günstiger als 6×1M |
| **Premium** | 219€ | 519€ | 869€ | 6M = 34% günstiger als 6×1M |

### Tool-Paket (Lead-Funnel, parallel zum MVP)

| Paket | Preis | Inhalt | Anrechnung |
|---|---|---|---|
| **Tool-Paket** | 39–49€ einmalig (final TBD) | Bewertung + KI-Exposé + Inserat-Texte | Wird beim späteren Verkäufer-Paket-Kauf angerechnet |

Zielgruppe: Eigentümer in Recherche-Phase, Erben, "irgendwann verkaufen"-User. Conversion-Pfad: Tool-Paket → E-Mail-Marketing → Verkäufer-Paket.

### Verlängerung

Listing wird nach Ablauf offline gestellt, alle Daten bleiben für 30 Tage zur direkten Reaktivierung erhalten. Verlängerung kostet pro Monat etwas mehr als der Erstkauf, damit Direktbuchung längerer Laufzeiten immer der günstigere Weg ist:

| Paket | Verlängerung 1 Monat |
|---|---|
| Basic | 149€ |
| Pro | 199€ |
| Premium | 259€ |

**Kontrollrechnung:** Basic 1M Erstkauf + 5× Verlängerung = 129 + 5×149 = 874€ vs Basic 6M Direktkauf 499€ → **375€ Vorteil bei Direktkauf**. Logik konsistent.

### Add-ons (alle Pakete)

- Makler-Stunde 50€/h, buchbar per Calendly + Stripe (Premium: 1h inklusive)
- Bewertungs-Re-Generierung: 19€ (nach 1. API-Call, gleicher Anbieter)
- Zusätzliche KI-Exposé-Generierung: 9€/Stück (nach 3 inkludierten)
- KI-Bildverbesserung: 1€/Bild (nach 20 inkludierten)

### Upsell-Logik

Basic ist der Türöffner zum gleichen Preis wie ohne-makler.net Einstieg. Pro matcht ohne-makler.net's Bestseller-Preis bei deutlichem Mehrwert. Premium ist einzigartig und hat keine direkte Konkurrenz. Gesperrte Features im Dashboard als Blur-Preview mit Upgrade-CTA sichtbar machen.

---

## 4. KI-Limits & Wirtschaftlichkeit

Damit kurze Laufzeiten (1 Monat) nicht zum Verlustgeschäft werden, gelten klare Limits pro Account:

| Feature | Tool-Paket | Basic | Pro | Premium | Nach Limit |
|---|---|---|---|---|---|
| KI-Chatbot (Nachrichten/Tag) | 30 | 10 | 30 | 100 | Hinweis "morgen wieder" |
| KI-Exposé-Generierungen | 3× | — | 3× | 3× | 9€/Stück |
| Inserat-Texte regenerieren | 5× | 5× | 10× | 20× | inkludiert |
| KI-Bildverbesserung | — | — | — | 20 Bilder | 1€/Bild |
| Bewertungs-Tool (echter API-Call) | 1× | — | 1× | 1× | 19€ Re-Gen |

**Caching-Logik Bewertung:** Pro `(user_id, adresse_hash)` genau 1× echter API-Call (egal welcher Anbieter — VALUE/Sprengnetter/PriceHubble). Response in Supabase (`immobilien_bewertungen`) gespeichert. Erneute Aufrufe der gleichen Adresse → Cache. Re-Generierung kostet 19€ als Add-on.

---

## 5. Features & Services

### Basic — alle Laufzeiten
- Listing auf du-bist-der-makler.de
- **ImmoScout24-Listing** (über Flatrate des Kollegen, manuell)
- Step-by-Step Checkliste (Bewertung → Inserat → Besichtigung → Notar)
- KI-Chatbot (10/Tag) — häufige Fragen, kein Rechtsrat (Disclaimer Pflicht)
- Interessenten-Anfragen per E-Mail-Forwarding

### Pro — alles aus Basic plus:
- **Alle Portale:** ImmoScout24 + Immowelt + eBay Kleinanzeigen + immobilien.de
- **KI-Exposé-Generator** — Formular-Inputs + Fotos → Claude API → PDF (3× inklusive)
- **KI-Chatbot** auf 30/Tag erweitert
- **CRM-Lite** — Interessenten verwalten, Status-Tracking, CSV-Export
- **Besichtigungskalender** — Termine planen, automatische E-Mail-Bestätigungen
- **Premium-Bewertung** — professioneller Bewertungs-Report mit drei Methoden (1× pro Adresse)
- **Energieausweis-Partner** (Affiliate-Marge: ~10–30€)

### Premium — alles aus Pro plus:
- **Makler-Support** — direkter Draht zum Kollegen, erste Stunde inklusive
- **KI-Bildverbesserung** — Replicate API (20 Bilder inklusive)
- **KI-Chatbot** auf 100/Tag erweitert
- Priorisierter Support bei allen Fragen

### Tool-Paket — Lead-Funnel für Recherche-Phase (Phase 1, parallel zum MVP)
- **Preis:** 39–49€ einmalig (final TBD)
- **Zielgruppe:** Eigentümer in Recherche-Phase (Erben, "irgendwann verkaufen", Marktüberblick)
- **Inhalt:** Bewertung + KI-Exposé-Generator + Inserat-Texte
- **Anrechnung:** Bei späterem Upgrade auf Verkäufer-Paket wird der Tool-Paket-Preis angerechnet
- **Technisch:** Gleiches Dashboard wie Verkäufer-User, aber Bereiche "Listing veröffentlichen", CRM, Termine, Makler-Support sind grayed out mit Upgrade-CTA

### Partner-Services (paketübergreifend)
- Energieausweis (Pflicht beim Verkauf — hoher Conversion-Punkt)
- Notarempfehlung (Affiliate)
- Professioneller Fotograf regional
- Grundriss-Erstellung

---

## 6. Bewertungs-Tool — Strategie

**Kein Free-Rechner.** Verworfen weil: tausend Konkurrenten haben kostenlose Hauswert-Rechner, SEO-Krieg gegen Riesenfirmen ist nicht gewinnbar, Strava-Effekt ist Wunschdenken bei Privatsphäre-sensiblen Daten. Marketing-Fokus: aggressive Werbung mit Pricing-Story statt SEO-Hoffen.

**Bewertungstool im Dashboard** für Tool-Paket + Pro + Premium User.

### API-Strategie (Stand Mai 2026, in Verhandlung)

| Anbieter | Status | Vorteil | Nachteil |
|---|---|---|---|
| **VALUE AG** | Anfrage gestellt | Identische Datenqualität wie ohne-makler.net | Keine Daten-Differenzierung, primär für Banken |
| **Sprengnetter** | Anfrage geplant | PropTech-freundlich, REPORT-API mit Custom Branding | Preise unbekannt |
| **PriceHubble** | Anfrage geplant | Schönster Output, technologisch fortschrittlich | Vermutlich teuerster Anbieter |

**Ziel:** Konditionen aller drei vergleichen, dann entscheiden. Für MVP-Launch ggf. mit dem flexibelsten Anbieter starten.

### Caching-Logik (egal welcher Anbieter)

Eine Adresse pro User → genau 1× echter API-Call. Response in Supabase (`immobilien_bewertungen`) gespeichert mit Hash aus normalisierter Adresse. Erneute Aufrufe der gleichen Adresse → Cache. Re-Generierung kostet 19€ als Add-on.

### Was wir besser machen als ohne-makler.net

ohne-makler.net liefert ein hässliches PDF mit drei Bewertungs-Methoden (Vergleichswert, Ertragswert, Sachwert) ohne Erklärung. Unser Bewertungstool:

- **Web-first Erlebnis** im Dashboard mit interaktiver Karte (Mapbox), modernen Charts, Hover-States
- **PDF als Export** — bank-tauglich für Finanzierungsverhandlungen
- **Klartext-Erklärungen** durch Claude: was bedeuten die drei Werte wirklich
- **Konsistentes Branding** in der grünen Akzentfarbe — nicht 2010er-Bank-Optik
- **Keine Vermietungs-Cross-Sell-Verwirrung** — Fokus auf Verkauf



---

## 7. Design & Branding

**Design-System:** Airbnb-Designsprache (awesome-design-md/airbnb) — gleiche Struktur, Spacing, Typografie, Komponenten-Logik. Vollständige Spezifikation in `DESIGN.md`.

**Akzentfarbe:** `#1B6B45` (warmes Dunkelgrün) — ersetzt Airbnb-Rot
- Bewusste Differenzierung: ohne-makler.net ist blau → wir sind grün
- Semantik: Geld sparen, Vertrauen, Sicherheit
- Hover: `#145538` / Light: `#E8F5EE`

**Font:** Inter (Google Fonts) — Gewichte 500/600/700 only, negatives Letter-Spacing auf Headlines

**Philosophie:** Weißes Canvas, ein Akzent, großzügiges Spacing, warmherzige Autorität — kein kaltes Tech-Feeling

---

## 8. Go-to-Market

### Phase 1 — MVP (Woche 1–4)
- Landing Page final mit 9-Pakete-Pricing-Matrix + Tool-Paket-CTA
- Polish bestehendes Dashboard (Bug-Fixes: HTML-Tags im PDF-Header, Energieausweis-Skala, Foto-Galerie)
- Stripe-Integration: 9 Verkäufer-Produkte + 1 Tool-Paket
- Auth-Flow Login → Onboarding → Dashboard sauber durchziehen
- Bewertungs-Tool im Dashboard: zunächst mit Claude + öffentlichen Daten (Phase 1 Übergangslösung)
- Erste 5 Test-User (Netzwerk des Kollegen)

### Phase 2 — Alpha (Monat 2)
- Echte API-Integration (VALUE/Sprengnetter/PriceHubble je nach Verhandlung)
- Listing-Veröffentlichung & öffentliche Inserat-Seite
- ImmoScout-Listing für Premium-Kunden (manuell)
- Tool-Paket → Verkäufer-Paket Upgrade-Flow inkl. Anrechnung
- Erste 20 zahlende Kunden

### Phase 3 — Beta (Monat 3)
- CRM-Lite, Interessenten-Verwaltung, Kalender
- Energieausweis-Partner angebunden
- KI-Bildverbesserung live
- Verlängerungs-Flow inkl. E-Mail-Erinnerungen

### Phase 4 — Launch (Monat 4)
- SEO-Grundlage: Keywords "Haus verkaufen ohne Makler", "Wohnung privat verkaufen"
- Aggressive Werbung: Google Ads + Meta Ads mit Pricing-Story
- Public Launch + Skalierung

### Später
- Mobile App (React Native — kein Wettbewerber hat das)
- Google Ads auf Longtail-Keywords + Meta Ads
- Affiliate-Netzwerk ausbauen
- ImmoScout API-Integration (wenn Volumen es rechtfertigt)
- AT/CH optional

---

## 9. Team

| Person | Rolle |
|---|---|
| Nico | Co-CEO, Tech / Webdesign / Automatisierung / Strategie |
| Makler-Kollege | Co-CEO, Fachlicher Support / Marktkenntnis / Netzwerk / ImmoScout-Zugang |

**Unternehmensform:** Noch offen — vorerst informelle Kooperation, GbR oder GmbH wenn erste Zahlen kommen.

**Zielmarkt:** Deutschland (Phase 1).

---

## 10. Tech Stack

| Bereich | Tool | Hinweis |
|---|---|---|
| Frontend | Next.js + Tailwind | App Router, Server Components, SEO-optimiert |
| Styling | Tailwind + DESIGN.md | Design-Tokens aus DESIGN.md |
| Animation | GSAP (optional) | Nur Landing Page Hero |
| Backend/DB | Supabase | Auth, Postgres, Storage (Fotos), Realtime |
| Email | Resend | Transaktional + Interessenten-Forwarding |
| Payment | Stripe | 9 Verkäufer-Produkte + 1 Tool-Paket + Add-ons |
| KI Text | Claude API (Sonnet) | Exposé, Inserat-Texte, Chatbot |
| KI Bilder | Replicate API | Bildverbesserung (Premium) |
| Bewertungs-API | TBD: VALUE AG / Sprengnetter / PriceHubble | Phase 1 → MVP-Launch |
| Maps | Mapbox / Maplibre | Bewertungs-Tool, Standort-Anzeige |
| Hosting | Vercel | Zero-Config, Preview-URLs, Edge Functions |
| Automatisierung | Make / n8n | Onboarding-Flows, E-Mail-Sequenzen |

### Seitenstruktur (Next.js App Router)

```
PUBLIC (ohne Login)
/ → Landingpage
/inserate/[slug] → Öffentliche Inserat-Seite
/login + /registrieren → Auth (Supabase)
/impressum + /datenschutz + /agb → Pflicht vor Launch

ONBOARDING
/onboarding → Paket-Typ wählen (Tools vs Verkäufer) → Laufzeit → Stripe Checkout

DASHBOARD (Login + aktives Paket — paket_typ-basierte Sichtbarkeit)
/dashboard → Übersicht (anders für tools vs seller)
/dashboard/objekt → Mein Objekt: Single Source of Truth (alle paket_typ)
/dashboard/inserat-texte → Inserat-Text-Generator (alle paket_typ)
/dashboard/expose → KI-Exposé-Generator (alle paket_typ)
/dashboard/preisrechner → Bewertungs-Tool (alle paket_typ)
/dashboard/chatbot → KI-Chatbot (alle paket_typ, mit Limits)
/dashboard/checkliste → Schritt-für-Schritt [seller only — grayed bei tools]
/dashboard/interessenten → CRM-Lite [seller Pro+ — grayed bei tools]
/dashboard/termine → Besichtigungskalender [seller Pro+ — grayed bei tools]
/dashboard/partner → Partner-Services [alle]
/dashboard/makler-support → Makler-Support [seller Premium — grayed sonst]
/dashboard/einstellungen → Konto, Rechnungen, Verlängerung
```

**Sichtbarkeits-Logik:** `paket_typ` Feld auf User-Tabelle:
- `tools` — Tool-Paket-User: KI-Tools + Mein Objekt zugänglich, Listing/CRM/Termine/Makler-Support grayed mit Upgrade-CTA
- `seller` — Verkäufer-User: alles je nach Paket-Tier (Basic/Pro/Premium)
- `none` — registriert ohne Paket: nur /onboarding

### Kern-Datenbankstruktur (Supabase)

```sql
users:                  id, email, paket_typ, paket_tier, paket_laufzeit_monate,
                        paket_start, paket_ende, stripe_customer_id, created_at
                        -- paket_typ: 'tools' | 'seller' | 'none'
                        -- paket_tier: 'basic' | 'pro' | 'premium' (nur bei seller)

listings:               id, user_id, status, alle Formular-Felder,
                        created_at, updated_at, offline_seit

interessenten:          id, listing_id, name, email, telefon, nachricht,
                        status, notizen, created_at

termine:                id, listing_id, interessent_id, datum, uhrzeit,
                        dauer_min, notiz, status

checkliste_status:      id, user_id, aufgabe_id, completed, completed_at

ki_usage:               id, user_id, feature_type, count, period_start
                        -- Tracking für Limits (Chatbot/Tag, Exposé-Gens etc.)

immobilien_bewertungen: id, user_id, adresse_hash, api_response,
                        api_provider, created_at, regeneration_count
                        -- Cache für teure API-Calls (VALUE/Sprengnetter/PriceHubble)
```

---

## 11. Datenspeicherung & DSGVO

| Phase | Was passiert |
|---|---|
| Aktive Laufzeit | Alle Daten verfügbar, Listing online |
| 0–30 Tage nach Ablauf | Listing offline, Daten gespeichert für 1-Klick-Reaktivierung |
| 30–90 Tage nach Ablauf | Account aktiv, aber Listing-Daten (Fotos, Interessenten) werden nach 90 Tagen gelöscht |
| 12 Monate ohne Aktivität | Account-Löschung mit Vorab-E-Mail-Warnung 30 Tage vorher |

In AGB festhalten. Cascade Delete in Supabase konfigurieren.

---

## 12. Offene Fragen & Entscheidungen

- [ ] **ImmoScout rechtlich klären:** Darf Kollege Objekte dritter Verkäufer unter seiner Makler-Lizenz inserieren? → Anwalt fragen vor Beta-Launch
- [ ] **Equity-Split:** GbR sofort oder informell bis erste Einnahmen? → Vor erstem zahlenden Kunden klären
- [ ] **Bewertungs-API-Vertrag:** VALUE AG (angefragt), Sprengnetter + PriceHubble parallel anfragen. Setup-Gebühr, Pay-per-Use, Mindestumsatz vergleichen — Entscheidung Phase 2
- [ ] **Tool-Paket Endpreis:** 39€ vs 49€ vs anderer Wert — final festlegen
- [ ] **Tool-Paket Anrechnungs-Logik:** Voller Betrag bei Verkäufer-Paket-Upgrade oder zeitlich limitiert?
- [ ] **Energieausweis-Partner:** Konkret klären wer (Klar Solar, Energie-Ausweis.de o.ä.) + Affiliate-Konditionen
- [ ] **Rechtliches:** Impressum, Datenschutz, AGB, Haftungsausschluss für KI vor Launch Pflicht
- [ ] **Upgrade-Flow:** MVP per Support-E-Mail, Phase 2 Stripe Billing Portal mit Pro-rata-Logik
- [ ] **Verlängerungs-Discounts:** Soll Verlängerung nach 6M billiger sein als nach 3M? (Loyalitäts-Komponente)

---

## 13. Projektdokumente

| Dokument | Zweck | Ablageort |
|---|---|---|
| `brain.md` | Zentrale Projektübersicht | Claude Projekt + Repo Root |
| `DESIGN.md` | Design-System für KI-Agenten | Next.js Repo-Root |
| `PRD.md` | Feature-Anforderungen, User Stories | Next.js Repo Root |
| `wettbewerbsanalyse.md` | Business-Kontext, Markt | Google Drive / Notion |
| Landingpage-Copy | Texte für die Landing Page | Google Drive / Notion |
