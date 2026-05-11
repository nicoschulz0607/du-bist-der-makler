# 🏠 brain.md — dubistdermakler.de

> Letztes Update: 9. Mai 2026
> Status: Pre-Launch — Frontend größtenteils gebaut, Stripe-Backend live, Pricing-Buttons noch nicht angeschlossen

---

## 1. Vision

Eine Plattform für privaten Immobilienverkauf **ohne Makler** — aber mit allen Tools, die man braucht, um es professionell zu machen. Zwischen "ich stell's auf ImmoScout" und "ich beauftrage einen Makler" gibt es eine echte Lücke. Diese Lücke füllen wir.

**Kern-Versprechen:** Du zahlst einmal. Du verkaufst selbst. Wir begleiten dich dabei.

---

## 2. Markt & Wettbewerb

| Anbieter | Modell | Preis (ca.) | Schwäche |
|---|---|---|---|
| ImmoScout24 | Listing-Abo für Makler | ~600€/Monat (Makler) | Nicht für Privat optimiert, teuer |
| ohne-makler.net | Listing-Einmalbuchung | ab 129€/Monat, bis 399€/3 Monate | Kein Support mehr (abgeschafft), kein CRM, keine App, buggy Nachrichtensystem |
| Klassischer Makler | Provision | 3–6% des Kaufpreises | Sehr teuer, Kontrollverlust |
| Homeday / McMakler | Hybrid-Makler (Provision) | ~3,57% | Immer noch Provision, kein Festpreis |
| **dubistdermakler.de** | Einmalzahlung + KI-Tools + Makler-Backup | 129–869€ je nach Paket × Laufzeit | Noch unbekannt, kein Traffic |

**Unser struktureller Vorteil:**
- Kollege zahlt 600€/Monat Flatrate bei ImmoScout → unbegrenzte Inserate
- ohne-makler.net rechnet pro Inserat ab → wir haben dauerhaften Kostenvorteil

**Unser Produkt-Vorteil:**
- Kein Abo (Einmalzahlung pro Laufzeit, keine Auto-Renewal)
- KI-gestützte Tools (Exposé, Chatbot, Preisrechner, Bildoptimierung)
- Makler-Support im Hintergrund ohne Maklerkosten
- Partner-Ökosystem (Energieausweis, Notar etc.)

**Wichtigste Schwächen der Konkurrenz (aus echten Bewertungen):**
- ohne-makler.net hat telefonischen Support abgeschafft → wir machen Support zum Kernfeature
- Nachrichten-System bei ohne-makler.net buggy
- Kein Anbieter hat echte KI-Tools im Standard

---

## 3. Pricing (Stand: in Stripe gepflegt, Source of Truth)

Drei Pakete × drei Laufzeiten = 9 Hauptprodukte. Längere Laufzeit = bessere €/Monat. Kein Abo, kein Auto-Renewal.

| Paket | 1 Monat | 3 Monate | 6 Monate |
|---|---|---|---|
| **Basic** | 129 € | 299 € | 499 € |
| **Pro** (empfohlen) | 169 € | 399 € | 669 € |
| **Premium** | 219 € | 519 € | 869 € |

**Nach Ablauf:** Listings werden automatisch von den Portalen genommen. User kann reaktivieren (1 Monat verlängern) oder ein neues Paket buchen. Kein automatisches Abo.

**Add-ons:**
- Tool-Paket 39€ (standalone — Bewertung, KI-Exposé, Inserat-Texte einmalig). Wird beim späteren Hauptpaket-Kauf voll angerechnet.
- Makler-Stunde 50€/h (für alle Pakete buchbar, Premium hat erste Stunde inklusive)

---

## 4. Pakete & Features

### Basic (ab 129€)
- ImmoScout24 Listing
- eBay Kleinanzeigen Listing
- Schritt-für-Schritt Checkliste
- 24/7 KI-Chatbot ("Klara KI-Assistentin")

### Pro (ab 169€) — alles aus Basic plus:
- Immowelt Listing (zusätzliches Portal)
- KI-Exposé-Generator (PDF)
- KI-Preisrechner (Marktwert-Schätzung)
- CRM-Lite (Interessenten + Termine)
- Energieausweis-Partner (Affiliate)

### Premium (ab 219€) — alles aus Pro plus:
- Alle verfügbaren Portale + maximale Sichtbarkeit
- KI-Bildoptimierung (Replicate API)
- Makler-Support (erste Stunde inklusive)

---

## 5. Aktueller Stand (9. Mai 2026)

### ✅ Steht und funktioniert

**Frontend / Landing**
- Landing Page komplett: Hero, So-funktioniert's, Features-Sektion, Pricing mit 1M/3M/6M-Toggle, Vergleichstabelle, FAQ, Closing-CTA, Footer
- Design-System auf Airbnb-Basis mit Akzentfarbe `#1B6B45` durchgezogen
- Pricing-Texte und Pakete-Inhalte mit Stripe-Backend abgeglichen
- Domain-Schreibweise konsolidiert: überall `dubistdermakler.de`, alle Mail-Adressen auf `kontakt@dubistdermakler.de`

**Dashboard**
- Sidebar mit Mein-Verkauf-Bereich, KI-Tools-Sektion, Interessenten-Sektion, Services
- Übersichts-Seite mit Schritt-für-Schritt-Banner, Stats, Mein-Objekt-Bereich, Tools-Grid
- Feature-Gates auf allen Pro/Premium-Tools mit Blur-Preview + "Pro freischalten →"-CTA
- Einstellungen-Seite mit Profil, Passwort, Paket-Block, Konto-Aktionen
- "Kein Paket"-States sauber gerendert

**Demo-Stub**
- /demo Route existiert mit "Demo kommt bald"-Platzhalter

**Stripe-Backend (lokal verifiziert)**
- 14 Produkte in Stripe Sandbox (3 Pakete × 3 Laufzeiten + Add-ons)
- Tax-Codes, Tax-Behavior (Inclusive), Branding, Zahlungsmethoden konfiguriert
- `/api/stripe/checkout` mit Discriminated Union (paket/reaktivierung/addon)
- `/api/stripe/webhook` für `checkout.session.completed` + `charge.refunded`
- Modell B umgesetzt: `pakete`-Tabelle als Source of Truth, `profiles.paket_*` als Cache
- Idempotenz via `UNIQUE(stripe_session_id)`, RLS-Policy aktiv
- Erfolgreich getestet: Erstkauf, Add-on, Reaktivierung, Permissive-Logik, Idempotenz

**Sicherheit**
- Supabase auf neue Publishable/Secret-Key-Architektur migriert
- `.env.local` korrekt gegitignored

**Infrastruktur (im Aufbau, ggf. heute)**
- Domain `dubistdermakler.de` (United Domains → Cloudflare Umzug geplant)
- Cloudflare Zero Trust für Admin-Zugang (geplant)
- Google Workspace mit `kontakt@dubistdermakler.de` aktiv
- Resend Domain-Verifikation (offen)
- Supabase Domain-Verifikation für Auth-Mails (offen)

### 🟠 Was als nächstes ansteht

**Stripe-Frontend-Anschluss (nächster großer Block)**
- Pricing-Seite-Buttons ("Basic wählen", "Pro wählen", "Premium wählen") an `/api/stripe/checkout` koppeln
- Tool-Paket-Box-Button an Stripe anschließen
- Erfolgs-/Abbruch-Handling auf `/dashboard?stripe=success|cancelled`
- "Verarbeitung läuft..."-Polling-State zwischen Stripe-Redirect und Webhook-Verarbeitung
- "Mein Paket"-Bereich im Dashboard (Restlaufzeit, Verlängern-Option)
- Reaktivierungs-Banner wenn Paket abgelaufen
- Makler-Stunde-Buchung im Dashboard

**Backend-Lücken**
- Cron-Job für abgelaufene Pakete (Vercel Cron oder Supabase Edge Function)
- Tool-Paket-Anrechnungs-Logik (Stripe-Coupon `TOOL_DISCOUNT_39`, Schema-Erweiterung `pakete.angerechnet_am`, Webhook-Erweiterung)
- Refund-Pfad manuell testen

**Vor Live-Gang Pflicht**
- Inhaberschafts-Frage Stripe-Account klären (Privatperson / Kollege / GbR)
- Geschäftskonto eröffnen, Stripe KYC, Stripe Tax aktivieren mit USt-ID
- Statement Descriptor: `DU BIST DER MAKLER`
- Live-Mode: Produkte via "Copy to Live" + Live-Webhook + Live-API-Keys in Vercel
- AGB, Datenschutz, Impressum live verlinkt
- Echte 1€-Test-Transaktion + sofort erstatten
- Vercel-Variablen: 17 Stripe + neue Supabase Keys eintragen
- Legacy Supabase Keys disablen
- Steuerberater-Gespräch zur Frage: Tools über Kleingewerbe oder GbR/GmbH abrechnen

**Stripe-Checkout-Branding (visuelles Polish)**
- Logo erstellen + hochladen in Stripe-Branding
- Pro Produkt ein Bild in Stripe hinterlegen
- Markenfarbe + Akzentfarbe getrennt (zwei Grüntöne)

### 🔵 Backlog (später, nicht im MVP)

- Mobile App (React Native)
- ImmoScout24 API-Integration (aktuell manuell über Kollegen-Account)
- PriceHubble-Integration für KI-Preisrechner (aktuell Claude-Schätzung)
- Energieausweis-Anbieter via iframe + Affiliate
- AI-Buyer-Scoring nach Besichtigung (CRM-04, AGG-Compliance-Review nötig)
- AT/CH-Expansion, Mehrsprachigkeit
- Embedded Stripe Checkout (wenn 100+ Käufer/Monat)
- Customer Portal für Rechnungs-Einsicht

---

## 6. Routing-Logik

```
Nicht eingeloggt
→ /                (Landing)
→ /login, /registrieren
→ /demo            (öffentliches Demo, später)
→ /inserate/[slug] (öffentliche Inserate)

Eingeloggt (egal ob Paket oder nicht)
→ /dashboard       (zentrale Eintrittstür, entscheidet selbst was angezeigt wird)
→ Feature-Gates regeln Tool-Zugriff je nach paket_tier
→ /onboarding      (Pricing-Auswahl, von "Paket wählen"-CTAs aus erreichbar)
→ /dashboard/einstellungen
```

**Login-Redirect: immer `/dashboard`.** Dashboard rendert je nach `hasActivePaket()`-Status entweder vollen Modus, "Kein Paket"-State, oder Reaktivierungs-Banner.

---

## 7. Team

| Person | Rolle |
|---|---|
| Nico | Co-CEO, Tech / Webdesign / Automatisierung / Strategie |
| Makler-Kollege | Co-CEO, Fachlicher Support / Marktkenntnis / Netzwerk / ImmoScout-Zugang |

**Unternehmensform:** Noch offen — vorerst informelle Kooperation, GbR oder GmbH wenn erste Zahlen kommen.

**Zielmarkt:** Deutschland (Phase 1).

---

## 8. Tech Stack

| Bereich | Tool | Hinweis |
|---|---|---|
| Frontend | Next.js + Tailwind | App Router, Server Components |
| Backend/DB | Supabase | Auth, Postgres, Storage, RLS aktiv |
| Email | Resend | Transaktional + Interessenten-Forwarding |
| Payment | Stripe | Hosted Checkout, Discriminated Union API |
| KI Texte | Claude API (Sonnet) | Exposé, Chatbot, Preisrechner |
| KI Bilder | Replicate API | Bildverbesserung |
| DNS / CDN | Cloudflare | Domain, Zero Trust für Admin (geplant) |
| Hosting | Vercel | Pro-Account |
| Automatisierung | n8n (self-hosted, Hetzner) | Onboarding-Flows, E-Mail-Sequenzen |

### Kern-Datenbank (Supabase)

```
profiles:           id, email, paket_tier (Cache), paket_aktiv_bis (Cache),
                    paket_laufzeit_monate (Cache), paket_aktiviert_am (Cache),
                    stripe_customer_id, created_at

pakete:             id, user_id, tier, laufzeit_monate, start_datum, ende_datum,
                    status (aktiv/storniert/abgelaufen/refunded),
                    stripe_session_id (UNIQUE), addon_type, angerechnet_am, created_at

listings:           id, user_id, status, alle Formular-Felder, created_at, updated_at

interessenten:      id, listing_id, name, email, telefon, nachricht, status, notizen

termine:            id, listing_id, interessent_id, datum, uhrzeit, dauer_min

checkliste_status:  id, user_id, aufgabe_id, completed, completed_at
```

---

## 9. Architektur-Entscheidungen

1. **Modell B (Cache + Source of Truth)** — `pakete` ist Source of Truth, `profiles.paket_*` ist Cache. Bei Konflikt gewinnt `pakete`.
2. **Permissive Validation** — Backend lässt alle Käufe durch, Webhook regelt Konflikte (altes Paket → `storniert`).
3. **Hosted Stripe Checkout** — Trust > Custom für junge Marke. Wechsel auf Embedded erst bei Volumen.
4. **One Route, Discriminated Union** — `/api/stripe/checkout` mit `kind: 'paket'|'reaktivierung'|'addon'`.
5. **TIMESTAMPTZ + 23:59:59 Rounding** — User bekommt Tagesende-Bonus bei Laufzeit-Ende.

---

## 10. Offene rechtliche & organisatorische Fragen

- **ImmoScout-Flatrate:** Darf Kollege Objekte dritter Verkäufer unter seiner Makler-Lizenz inserieren? Anwalt vor Beta-Launch.
- **Equity-Split Nico / Kollege:** GbR sofort vs. informell bis erste Einnahmen vs. GmbH direkt.
- **Steuerliche Trennung:** Tools für dubistdermakler.de via Kleingewerbe oder GbR/GmbH? Steuerberater vor erstem zahlenden Kunden.
- **AGG-Review für AI-Buyer-Scoring** vor CRM-04 Live.
- **AGB / Datenschutz / Impressum** vor Live-Gang Pflicht.

---

## 11. Projektdokumente

| Dokument | Zweck | Ablageort |
|---|---|---|
| `brain.md` | Zentrale Projektübersicht | Claude Projekt + Repo-Root |
| `design.md` | Design-System für KI-Agenten | Repo-Root |
| `prd.md` | Feature-Anforderungen, User Stories | Repo |
| `stripe-integration-uebergabe.md` | Detail-Status Stripe-Setup | Lokal / Drive |
| Wettbewerbsanalyse | Business-Kontext, Markt | Google Drive / Notion |
| Landingpage-Copy | Texte für die Landing Page | Google Drive / Notion |

---

## 12. Recent Updates

- **Mai 2026 — Sprint 4a abgeschlossen:** Operations + Verkäufe Views live. LineChart neu gebaut. ImmoScout-Auslastung, Anfrage-Volumen, Inaktive Listings, Upcoming Termine implementiert.
- **Mai 2026 — SLA-Tracking deferred:** `makler_anfragen.bestaetigt_am` Column fehlt — echte Antwortzeit-SLA nicht messbar. Operations-View zeigt aktuell Anfrage-Volumen + Überfällige (>24h offen). Echtes SLA-Tracking kommt Sprint 5: (1) Migration für `bestaetigt_am`, (2) App-seitige Bestätigungs-UI für den Makler-Kollegen.
