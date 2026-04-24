# 🏠 brain.md — du-bist-der-makler.de

> Letztes Update: April 2026
> Status: Konzeptphase / Pre-Launch

---

## 1. Vision

Eine Plattform für privaten Immobilienverkauf **ohne Makler** – aber mit allen Tools, die man braucht, um es professionell zu machen. Zwischen "ich stell's auf ImmoScout" und "ich beauftrage einen Makler" gibt es eine echte Lücke. Diese Lücke füllen wir.

**Kern-Versprechen:** Du zahlst einmal. Du verkaufst selbst. Wir begleiten dich dabei.

---

## 2. Markt & Wettbewerb

| Anbieter | Modell | Preis (ca.) | Schwäche |
|---|---|---|---|
| ImmoScout24 | Listing-Abo für Makler | ~600€/Monat (Makler) | Nicht für Privat optimiert, teuer |
| ohne-makler.net | Listing-Einmalbuchung | ab 129€/Monat, bis 399€/3 Monate | Kein Support mehr (abgeschafft), kein CRM, keine App, buggy Nachrichtensystem |
| Klassischer Makler | Provision | 3–6% des Kaufpreises | Sehr teuer, Kontrollverlust |
| Homeday / McMakler | Hybrid-Makler (Provision) | ~3,57% | Immer noch Provision, kein Festpreis |
| **du-bist-der-makler.de** | Einmalzahlung + KI-Tools + Makler-Backup | 299–699€ für 6 Monate | Noch unbekannt, kein Traffic |

**Unser struktureller Vorteil:**
- Kollege zahlt 600€/Monat Flatrate bei ImmoScout → unbegrenzte Inserate
- Break-Even: ~5 Premium-Kunden → danach reiner Gewinn auf diesem Kostenblock
- ohne-makler.net rechnet pro Inserat ab → wir haben dauerhaften Kostenvorteil

**Unser Produkt-Vorteil:**
- Kein monatlicher Druck (6 Monate Festpreis)
- KI-gestützte Tools (Exposé, Chatbot, Preisrechner, Bildverbesserung)
- Makler-Support im Hintergrund ohne Maklerkosten
- Partner-Ökosystem (Energieausweis, Notar etc.)
- Mobile App geplant (hat kein Wettbewerber)

**Wichtigste Schwächen der Konkurrenz (aus echten Bewertungen):**
- ohne-makler.net hat telefonischen Support abgeschafft → wir machen Support zum Kernfeature
- Nachrichten-System bei ohne-makler.net buggy
- Kein Anbieter hat eine App
- Kein Anbieter hat echte KI-Tools im Standard

---

## 3. Pricing (bestätigt)

Drei Stufen mit klarem Upsell-Pfad. Kein Abo. Keine automatische Verlängerung.

| Paket | Preis | Laufzeit | Kern-Leistung |
|---|---|---|---|
| **Starter** | 299€ | 6 Monate | Listing auf du-bist-der-makler.de + Checkliste + KI-Chatbot |
| **Pro** | 499€ | 6 Monate | + KI-Exposé, Preisrechner, CRM-Lite, Energieausweis-Partner |
| **Premium** | 699€ | 6 Monate | + ImmoScout/eBay Kleinanzeigen Listing, KI-Bildverbesserung, Makler-Support |

**Add-on (alle Pakete):** Makler-Stunde 50€/h, buchbar per Calendly + Stripe. Premium: erste Stunde inklusive.

> Upsell-Logik: Starter ist der Türöffner. Die meisten werden upgraden, sobald sie merken wie viel Arbeit der Verkauf ist. Gesperrte Features im Dashboard als Blur-Preview mit Upgrade-CTA sichtbar machen.

---

## 4. Features & Services

### Starter (299€)
- [ ] Listing auf du-bist-der-makler.de (6 Monate)
- [ ] Step-by-Step Checkliste (Bewertung → Inserat → Besichtigung → Notar)
- [ ] KI-Chatbot 24/7 (häufige Fragen, kein Rechtsrat — Disclaimer Pflicht)

### Pro (499€) – alles aus Starter plus:
- [ ] **KI-Exposé-Generator** – Formular-Inputs + Fotos → Claude API → PDF
- [ ] **KI-Preisrechner** – Marktwert-Einschätzung auf Basis von Lage, Größe, Zustand (Claude API + Disclaimer)
- [ ] **CRM-Lite** – Interessenten verwalten, Besichtigungstermine planen, Status-Tracking
- [ ] **Energieausweis** über Partner (Affiliate-Marge: ~10–30€)

### Premium (699€) – alles aus Pro plus:
- [ ] **Portal-Listing** – ImmoScout24 + eBay Kleinanzeigen (MVP: manuell über Kollegen-Account)
- [ ] **KI-Bildverbesserung** – Replicate API (ein API-Call)
- [ ] **Makler-Support** – direkter Draht zum Kollegen, erste Stunde inklusive

### Partner-Services (paketübergreifend)
- [ ] Energieausweis (Pflicht beim Verkauf – hoher Conversion-Punkt)
- [ ] Notarempfehlung (Affiliate)
- [ ] Professioneller Fotograf regional
- [ ] Grundriss-Erstellung

---

## 5. Design & Branding

**Design-System:** Airbnb-Designsprache (awesome-design-md/airbnb) — gleiche Struktur, Spacing, Typografie, Komponenten-Logik. Vollständige Spezifikation in `DESIGN.md`.

**Akzentfarbe:** `#1B6B45` (warmes Dunkelgrün) — ersetzt Airbnb-Rot
- Bewusste Differenzierung: ohne-makler.net ist blau → wir sind grün
- Semantik: Geld sparen, Vertrauen, Sicherheit
- Hover: `#145538` / Light: `#E8F5EE`

**Font:** Inter (Google Fonts) — Gewichte 500/600/700 only, negatives Letter-Spacing auf Headlines

**Philosophie:** Weißes Canvas, ein Akzent, großzügiges Spacing, warmherzige Autorität — kein kaltes Tech-Feeling

---

## 6. Go-to-Market

### Phase 1 – MVP (Woche 1–2)
- Landing Page + Waitlist live schalten (Vercel Test-Domain)
- Next.js Projekt initialisieren, Supabase + Stripe einrichten
- Erstes Inserat manuell testen

### Phase 2 – Alpha (Monat 1)
- Dashboard Grundgerüst mit Feature-Flags
- KI-Exposé-Generator live
- Erste echte Verkäufer (Freunde/Familie/Netzwerk des Kollegen)

### Phase 3 – Beta (Monat 2)
- CRM-Lite, Interessenten-Verwaltung, Kalender
- Energieausweis-Partner angebunden
- ImmoScout-Listing für Premium-Kunden (manuell)

### Phase 4 – Launch (Monat 3)
- KI-Bildverbesserung live
- SEO-Grundlage: Keywords "Haus verkaufen ohne Makler", "Wohnung privat verkaufen"
- Public Launch + erste 20 Kunden

### Später
- Mobile App (React Native — kein Wettbewerber hat das)
- Google Ads auf Longtail-Keywords
- Affiliate-Netzwerk ausbauen
- ImmoScout API-Integration (wenn Volumen es rechtfertigt)
- AT/CH optional

---

## 7. Team

| Person | Rolle |
|---|---|
| Nico | Co-CEO, Tech / Webdesign / Automatisierung / Strategie |
| Makler-Kollege | Co-CEO, Fachlicher Support / Marktkenntnis / Netzwerk / ImmoScout-Zugang |

**Unternehmensform:** Noch offen – vorerst informelle Kooperation, GbR oder GmbH wenn erste Zahlen kommen.

**Zielmarkt:** Deutschland (Phase 1).

---

## 8. Tech Stack

| Bereich | Tool | Hinweis |
|---|---|---|
| Frontend | Next.js + Tailwind | App Router, Server Components, SEO-optimiert |
| Styling | Tailwind + DESIGN.md | Design-Tokens aus DESIGN.md |
| Animation | GSAP (optional) | Nur Landing Page Hero |
| Backend/DB | Supabase | Auth, Postgres, Storage (Fotos), Realtime |
| Email | Resend | Transaktional + Interessenten-Forwarding |
| Payment | Stripe | Einmalzahlung + Add-on (50€/h) |
| KI | Claude API (Sonnet) | Exposé, Chatbot, Preisrechner |
| KI Bilder | Replicate API | Bildverbesserung, ein API-Call |
| Hosting | Vercel | Zero-Config, Preview-URLs |
| Automatisierung | Make / n8n | Onboarding-Flows, E-Mail-Sequenzen |

### Seitenstruktur (Next.js App Router)

```
/ → Landingpage (public)
    ├── Hero + USP
    ├── So funktioniert's (3 Schritte)
    ├── Pricing (3 Pakete)
    ├── Vergleich vs. Makler / ohne-makler.net
    ├── FAQ
    └── CTA → Account erstellen

/login + /registrieren → Auth (Supabase)
/onboarding → Paket wählen + Stripe Checkout

/dashboard → Geschützter Bereich
    ├── Mein Objekt (Listing erstellen/bearbeiten)
    ├── KI-Exposé-Generator [Pro+]
    ├── KI-Preisrechner [Pro+]
    ├── Interessenten-CRM [Pro+]
    ├── Besichtigungskalender [Pro+]
    ├── Checkliste (alle Pakete)
    ├── Partner-Services (alle Pakete)
    └── Makler-Stunde buchen (Add-on 50€/h)

/inserate/[slug] → Öffentliche Inserat-Seite
/impressum + /datenschutz + /agb → Pflicht vor Launch
```

### Kern-Datenbankstruktur (Supabase)
```
users:          id, email, paket_tier, stripe_customer_id, created_at
listings:       id, user_id, status, alle Formular-Felder, created_at
interessenten:  id, listing_id, name, email, telefon, nachricht, status, notizen
termine:        id, listing_id, interessent_id, datum, uhrzeit, dauer_min
checkliste:     id, user_id, aufgabe_id, completed, completed_at
```

---

## 9. Offene Fragen & Entscheidungen

- [ ] **ImmoScout rechtlich klären:** Darf Kollege Objekte dritter Verkäufer unter seiner Makler-Lizenz inserieren? → Anwalt fragen vor Beta-Launch
- [ ] **Equity-Split:** GbR sofort oder informell bis erste Einnahmen? → Vor erstem zahlenden Kunden klären
- [ ] **Upgrade-Flow:** MVP per Support-E-Mail, Phase 2 Stripe Billing Portal
- [ ] **KI-Preisrechner:** Claude-Schätzung mit Disclaimer reicht für MVP, Phase 2 ggf. Sprengnetter/Pricehubble API
- [ ] **Energieausweis-Partner:** Konkret klären wer (Klar Solar, Energie-Ausweis.de o.ä.) + Affiliate-Konditionen
- [ ] **Rechtliches:** Impressum, Datenschutz, AGB, Haftungsausschluss für KI vor Launch Pflicht
- [ ] **KI-Video:** Für MVP kein Video — erst wenn CRM + Exposé stabil

---

## 10. Projektdokumente

| Dokument | Zweck | Ablageort |
|---|---|---|
| `brain.md` | Zentrale Projektübersicht | Claude Projekt + Notion/Drive |
| `DESIGN.md` | Design-System für KI-Agenten | Next.js Repo-Root |
| `PRD.md` | Feature-Anforderungen, User Stories | Next.js Repo /docs oder Root |
| Wettbewerbsanalyse | Business-Kontext, Markt | Google Drive / Notion |
| Landingpage-Copy | Texte für die Landing Page | Google Drive / Notion |