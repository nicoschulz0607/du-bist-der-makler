# 🛰️ HELIOS — Admin-Dashboard für du-bist-der-makler.de

> Spezifikation für Claude Code · Version 1.1 · Mai 2026
> Ablage: Repo-Root (neben DESIGN.md und PRD.md)

---

## Was ist HELIOS?

HELIOS ist die interne Kommandozentrale für du-bist-der-makler.de. Eine geschützte Route im Haupt-Projekt, von der aus Nico und sein Makler-Kollege das gesamte Business sehen und steuern: Umsatz, Kunden, Listings, Funnels, Kosten, Marge, Operations.

**Der Name ist provisorisch.** Easy umbenennbar — taucht nur in `lib/helios/`, der Route `/helios` und im UI-Header auf.

---

## Grundprinzipien

1. **Server-first.** Fast alles als Next.js Server Components. Daten serverseitig, kein Client-Fetching.
2. **Drei Schichten:** Sources → Aggregations → Views. Strikt getrennt.
3. **Design-Tokens überall.** Keine Hardcoded Werte. Style komplett austauschbar durch Token-Wechsel.
4. **Komponenten-Bibliothek.** Wiederverwendbare UI-Bausteine in `lib/helios/components/`.
5. **Ausbaubar in Sprints.** Sprint 1 Read-Only. Spätere Sprints fügen Aktionen hinzu, ohne Architektur zu ändern.
6. **Ein Look, gleiche Sicht.** Beide User sehen dasselbe.
7. **DSGVO bleibt.** Keine Klartext-Nachrichten, keine Foto-Inhalte, keine Adressen in Events.

---

## Sicherheit & Zugriff

### Route
- **Pfad:** `/helios` im Haupt-Projekt
- **Echter Schutz** statt Security-through-Obscurity

### Auth-Mechanismus
- Supabase Auth + zusätzliche Tabelle `admin_users`
- Middleware `middleware.ts` prüft bei Request auf `/helios/*`:
  1. Eingeloggt? → sonst Redirect `/login?next=/helios`
  2. E-Mail in `admin_users`? → sonst 404
- Service Role Key **nur** in `/helios` Server Components & Server Actions

### Tabelle `admin_users`
```sql
create table admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  added_at timestamptz default now(),
  added_by text
);

insert into admin_users (email, added_by) values
  ('nico@…', 'system'),
  ('kollege@…', 'system');
```

### Sicherheits-Checkliste
- [ ] Service Role Key nur server-side
- [ ] Stripe Secret Key nur server-side
- [ ] PostHog Personal API Key nur server-side
- [ ] `/helios` aus Sitemap und Robots.txt ausschließen
- [ ] Audit-Log für alle schreibenden Aktionen

---

## Architektur-Übersicht

```
src/
├── app/
│   ├── helios/
│   │   ├── layout.tsx              # Sidebar + Header, Auth-Guard
│   │   ├── page.tsx                # Übersicht
│   │   ├── kunden/page.tsx
│   │   ├── kunden/[id]/page.tsx
│   │   ├── listings/page.tsx
│   │   ├── listings/[id]/page.tsx
│   │   ├── funnel/page.tsx
│   │   ├── kosten/page.tsx
│   │   ├── operations/page.tsx
│   │   ├── verkaeufe/page.tsx
│   │   └── actions.ts              # Server Actions
│   └── api/webhooks/...
├── lib/
│   ├── helios/
│   │   ├── auth.ts                 # requireAdmin()
│   │   ├── tokens.ts               # ⭐ Design-Tokens zentral
│   │   ├── sources/                # Daten-Adapter
│   │   │   ├── stripe.ts
│   │   │   ├── supabase.ts
│   │   │   ├── posthog.ts
│   │   │   ├── anthropic.ts
│   │   │   ├── replicate.ts
│   │   │   └── resend.ts
│   │   ├── aggregations/
│   │   │   ├── umsatz.ts
│   │   │   ├── conversion.ts
│   │   │   ├── marge.ts
│   │   │   └── operations.ts
│   │   └── components/             # ⭐ UI-Bausteine
│   │       ├── primitives/
│   │       ├── kpi/
│   │       ├── tables/
│   │       ├── charts/
│   │       ├── layout/
│   │       └── feedback/
│   └── analytics/track.ts          # Hybrid-Tracker
└── middleware.ts
```

---

## ⭐ Design-Tokens & Theming-System

**Das wichtigste Prinzip von HELIOS:** Wenn der Style geändert werden soll, ändert man EINE Datei — nicht 50.

### Wie es funktioniert (drei Ebenen)

```
1. Theme-Datei (lib/helios/tokens.ts)
   ↓ definiert
2. CSS-Variablen (globals.css :root)
   ↓ konsumiert von
3. Tailwind-Klassen (in Komponenten)
```

### `lib/helios/tokens.ts`

Eine zentrale Datei mit allen Design-Entscheidungen:

```ts
export const heliosTokens = {
  // Farben (HSL für leichte Anpassung)
  colors: {
    background: 'hsl(0 0% 100%)',
    surface: 'hsl(0 0% 99%)',
    surfaceMuted: 'hsl(150 20% 97%)',
    border: 'hsl(150 10% 90%)',

    text: 'hsl(150 10% 15%)',
    textMuted: 'hsl(150 5% 45%)',
    textSubtle: 'hsl(150 5% 60%)',

    accent: 'hsl(150 60% 26%)',         // #1B6B45
    accentHover: 'hsl(150 60% 20%)',
    accentSoft: 'hsl(150 50% 95%)',

    success: 'hsl(140 60% 35%)',
    warning: 'hsl(38 90% 50%)',
    danger: 'hsl(0 70% 50%)',
    info: 'hsl(210 70% 50%)',
  },

  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontFamilyMono: 'JetBrains Mono, monospace',
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.5rem',     // 24px
      '2xl': '2rem',    // 32px
      '3xl': '3rem',    // 48px
    },
    weights: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  },

  spacing: {
    1: '0.25rem', 2: '0.5rem', 3: '0.75rem', 4: '1rem',
    6: '1.5rem',  8: '2rem',   12: '3rem',  16: '4rem',
  },

  radii: {
    sm: '0.375rem', md: '0.5rem', lg: '0.75rem', xl: '1rem', full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 2px 8px rgba(0, 0, 0, 0.06)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.08)',
  },

  motion: {
    fast: '120ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '320ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};
```

### CSS-Variablen in `globals.css`

```css
:root {
  --bg: hsl(0 0% 100%);
  --surface: hsl(0 0% 99%);
  --surface-muted: hsl(150 20% 97%);
  --border: hsl(150 10% 90%);
  --text: hsl(150 10% 15%);
  --text-muted: hsl(150 5% 45%);
  --accent: hsl(150 60% 26%);
  --accent-hover: hsl(150 60% 20%);
  /* … */
}
```

### Tailwind-Config

```ts
theme: {
  extend: {
    colors: {
      bg: 'var(--bg)',
      surface: 'var(--surface)',
      'surface-muted': 'var(--surface-muted)',
      border: 'var(--border)',
      text: 'var(--text)',
      'text-muted': 'var(--text-muted)',
      accent: 'var(--accent)',
      'accent-hover': 'var(--accent-hover)',
    },
  },
},
```

### Resultat in Komponenten

**Niemals** `bg-[#1B6B45]` oder `text-gray-600`. **Immer**:

```tsx
<div className="bg-surface border border-border text-text">
  <span className="text-text-muted">Umsatz</span>
  <button className="bg-accent hover:bg-accent-hover text-white">
    Aktion
  </button>
</div>
```

### Style komplett austauschen

**1. Nur Akzent ändern:** `tokens.ts`, `accent` von Grün auf Blau, fertig. **30 Sekunden.**

**2. Komplett neues Theme:** Zweite Token-Datei `tokensLinear.ts` anlegen, in `globals.css` `[data-theme="linear"]` Block, Theme-Switcher als Settings-Option. **4-8 Stunden.**

**3. Komponente austauschen:** `KPICard.tsx` ändern. Alle 12 Verwendungsstellen ändern sich automatisch. **30-60 Min.**

### Regel für Claude Code

> **NIEMALS** Hex-Codes, RGB-Werte oder px-Werte direkt in Komponenten. **IMMER** über Tokens / Tailwind-Klassen, die aus den Tokens kommen. Wenn ein Wert fehlt: **erst Token erweitern**, dann verwenden.

---

## ⭐ Komponenten-Bibliothek

In `lib/helios/components/` — wiederverwendbare UI. Jede Komponente einmal definiert, überall importiert.

### Struktur

```
components/
├── primitives/              # Atome
│   ├── Card.tsx
│   ├── Badge.tsx            # success/warning/danger/info
│   ├── Button.tsx           # primary/secondary/ghost/danger
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Tooltip.tsx
│   └── Divider.tsx
│
├── kpi/                     # KPI-Anzeigen
│   ├── KPICard.tsx          # Standard: Label + Zahl + Trend
│   ├── KPICardLarge.tsx     # Hero-Variante
│   ├── KPISparkline.tsx     # mit Mini-Linien-Chart
│   └── KPIComparison.tsx    # Aktuell vs. Vergleichszeitraum
│
├── tables/
│   ├── DataTable.tsx        # Generisch (TanStack Table)
│   ├── DataTableSearch.tsx
│   ├── DataTableFilters.tsx
│   ├── DataTablePagination.tsx
│   ├── EmptyState.tsx
│   └── ColumnHelpers.tsx    # Standard-Spalten: Datum, Geld, Status
│
├── charts/                  # Recharts-basiert, austauschbar
│   ├── ChartCard.tsx        # Wrapper: Titel + Chart + Footer
│   ├── LineChart.tsx
│   ├── BarChart.tsx
│   ├── AreaChart.tsx
│   ├── DonutChart.tsx
│   └── ChartTheme.ts        # Chart-Farben aus Tokens
│
├── layout/
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── PageWrapper.tsx
│   ├── PageHeader.tsx       # Titel + Subtitel + Aktions-Buttons
│   └── SectionGrid.tsx      # Responsive Grid für KPI-Reihen
│
└── feedback/
    ├── Toast.tsx
    ├── Skeleton.tsx
    ├── ErrorState.tsx
    └── ConfirmDialog.tsx
```

### Komponenten-Verträge (Beispiel-APIs)

```tsx
// KPI-Karte: nimmt Daten + zeigt sie an. Weiß nichts über Datenquelle.
<KPICard
  label="Umsatz Mai"
  value={4280}
  format="eur"
  trend={{ value: 12.4, label: "vs. April" }}
  status="positive"
/>

// DataTable: generisch über Datentyp T
<DataTable<Kunde>
  data={kunden}
  columns={kundenColumns}
  searchable
  filters={[{ key: 'paket', options: ['Starter', 'Pro', 'Premium'] }]}
  pagination
  onRowClick={(k) => router.push(`/helios/kunden/${k.id}`)}
/>

// ChartCard: deklarativ, austauschbarer Chart-Type
<ChartCard
  title="Umsatz letzte 30 Tage"
  data={umsatzDaten}
  type="line"
  xKey="datum"
  yKeys={['umsatz']}
  format="eur"
/>
```

### Vorteil dieser Struktur

- **Konsistenz:** Alle KPI-Karten gleich. Alle Tabellen gleich.
- **Änderungs-Reichweite:** `KPICard.tsx` ändern → alle 12 KPIs gleichzeitig geändert.
- **Austauschbar:** Geilere KPI-Karte gefunden? Eine Datei tauschen, alle Verwendungsstellen unberührt.
- **Testbar:** Komponenten isoliert testbar.

### Regel für Claude Code

> Bevor UI erstellt wird: **prüfe ob passende Komponente in `lib/helios/components/` existiert**. Wenn ja: importieren. Wenn nein und wiederverwendbar: neu in Bibliothek anlegen, dann importieren. **NIEMALS** ad-hoc Inline-UI in Page-Files schreiben außer für seitenspezifische Composition.

---

## Daten-Strategie: Hybrid Event-Tracking

### Warum Hybrid?
- **PostHog** für Web-Events (Pageviews, Clicks, anonyme Funnels vor Login)
- **Supabase** für Business-Events (Käufe, Verkäufe, Status-Wechsel) — relational mit Foreign Keys
- Beides parallel: jede Quelle macht was sie am besten kann

### Tabelle `business_events`
```sql
create table business_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id uuid references users(id),
  listing_id uuid references listings(id),
  properties jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index on business_events (event_name, created_at desc);
create index on business_events (user_id) where user_id is not null;
create index on business_events (listing_id) where listing_id is not null;
```

### Tracker `lib/analytics/track.ts`

```ts
type BusinessEvent =
  | 'checkout_abgeschlossen'
  | 'listing_veröffentlicht'
  | 'verkauf_abgeschlossen'
  | 'expose_generiert'
  | 'interessent_eingegangen'
  | 'termin_erstellt'
  | 'makler_stunde_gebucht'
  | 'paket_upgrade'
  | 'refund_ausgelöst';

type WebEvent =
  | 'landing_viewed'
  | 'hero_cta_clicked'
  | 'pricing_paket_hovered'
  | 'faq_geöffnet'
  | 'chatbot_geöffnet'
  | 'preisrechner_genutzt';

export function trackWeb(event: WebEvent, props: Record<string, any>) { ... }

export async function trackBusiness(
  event: BusinessEvent,
  props: { user_id?: string; listing_id?: string; [k: string]: any }
) { ... }
```

**Regel:** Events die in `/helios`-Aggregationen landen → `trackBusiness`. Reine Frontend-Events → `trackWeb`.

### Audit-Log
```sql
create table helios_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamptz default now()
);
```
Jede Server Action in `/helios` schreibt einen Eintrag.

---

## Daten-Quellen (Source-Adapter)

Jeder Adapter mit Caching via `unstable_cache` oder `revalidate`.

### `stripe.ts`
- `fetchUmsatzZeitraum`, `fetchKunden`, `fetchRefunds`, `fetchPaketMix`
- `issueRefund` — schreibend, Server Action only
- Cache: 5 Min

### `supabase.ts`
- `fetchListings`, `fetchUserDetails`, `fetchAktiveListings`, `fetchListingsOhneAktivität`, `fetchAnstehendeTermine`, `fetchVerkäufeZeitraum`
- `setListingStatus` — schreibend
- Service Role Key, RLS bypassed

### `posthog.ts`
- `fetchFunnel`, `fetchTopUtmQuellen`, `fetchConversionRate`
- PostHog EU API (`eu.posthog.com`)
- Cache: 15 Min

### `anthropic.ts`
- `fetchTokenVerbrauch`, `fetchKostenZeitraum` (Anthropic Admin API)
- Cache: 1 Stunde

### `replicate.ts`
- `fetchPredictions`, `fetchKostenZeitraum`
- Cache: 1 Stunde

### `resend.ts`
- `fetchEmailStats` (Sent, Delivered, Opened, Bounced)
- Cache: 30 Min

---

## Aggregations

In `lib/helios/aggregations/`:

### `umsatz.ts`
- `umsatzAktuellerMonat`, `umsatzVormonat`, `umsatzTrend`
- `umsatzNachPaket`, `durchschnittlicherBestellwert`

### `conversion.ts`
- `conversionLandingZuKauf`, `conversionRegistrierungZuKauf`, `conversionWaitlistZuKauf`

### `marge.ts`
- `kostenProKundeNachPaket`, `margePaket`
- `margenWarnung` — true wenn < 70%

### `operations.ts`
- `slaPremiumPostfach`, `auslastungMaklerStunden`
- `auslastungImmoScoutFlatrate`, `inaktiveListings`

---

## Die Views

### Layout
- **Sidebar:** Übersicht / Kunden / Listings / Funnel / Kosten / Operations / Verkäufe / Einstellungen
- **Header:** Logo "HELIOS · du-bist-der-makler.de" + User + Logout

### Übersicht (`/helios`)
**Hero-Zeile (4 KPI-Karten):** Umsatz Monat + Trend, Verkäufe abgeschlossen, Aktive Listings (Aufschlüsselung Paket), Conversion Landing → Kauf.

**Zweite Zeile (3 Karten):** Marge-Gesundheit pro Paket, KI-Kosten, SLA Premium-Postfach.

**Dritte Zeile:** Aktivität-Feed (letzte 20 Business-Events, Realtime via Supabase).

### Kunden (`/helios/kunden`)
**Tabelle:** E-Mail, Paket, Listing-Status, Interessenten, Kaufdatum, Total Spent, letzte Aktivität. Filter, Suche, Klick → Detail.

**Detail (`/helios/kunden/[id]`):** Stammdaten + Listings + Interessenten + Termine + Stripe-Historie. Aktionen ab Sprint 2.

### Listings (`/helios/listings`)
**Tabelle:** Titel/Ort, Verkäufer, Paket, Status, Preis, Interessenten, Tage aktiv, ImmoScout-Status. Highlight: > 14 Tage ohne Aktivität.

**Detail (`/helios/listings/[id]`):** Alle Daten + Interessenten + Termine. Aktionen: veröffentlichen, ImmoScout-Status, als verkauft markieren.

### Funnel (`/helios/funnel`)
PostHog-Daten 30 Tage, 4 Kern-Funnels, UTM-Quellen, Waitlist-Conversion.

### Kosten (`/helios/kosten`)
Tag/Woche/Monat, pro Quelle (Claude/Replicate/Stripe/Vercel/Resend/ImmoScout), pro Paket (Kosten/Kunde, Marge €/%). Warnungen < 70% Marge.

### Operations (`/helios/operations`)
Anstehende Termine 7 Tage, Premium-Postfach Status, Makler-Stunden, ImmoScout-Auslastung.

### Verkäufe (`/helios/verkaeufe`)
Verkaufte Listings, durchschnittliche Verkaufsdauer, Verkaufspreis-Verteilung.

### Einstellungen (`/helios/einstellungen`)
Admin-User-Verwaltung, Audit-Log, Cache leeren, Theme-Switcher (sobald mehrere Themes).

---

## Server Actions (Sprint 2+)

```ts
'use server';

export async function issueRefund(formData: FormData) { ... }
export async function setListingStatus(listingId: string, status: string) { ... }
export async function setImmoScoutStatus(listingId: string, status: string) { ... }
export async function upgradeUserPaket(userId: string, neuesPaket: string) { ... }
export async function sendCustomEmail(userId: string, betreff: string, body: string) { ... }
export async function addAdminUser(email: string) { ... }
export async function removeAdminUser(email: string) { ... }
```

Jede Action: `requireAdmin()` Check, Daten-Operation, Audit-Log, `revalidatePath`.

---

## ⭐ Erweiterungs-Anleitung

Wenn Nico später was hinzufügen will, hier die Standard-Pfade:

### Neue View
**Beispiel:** "Marketing-Kampagnen".
1. `app/helios/kampagnen/page.tsx`
2. Sidebar in `lib/helios/components/layout/Sidebar.tsx` ergänzen
3. Falls neue Daten: Adapter in `lib/helios/sources/`
4. Falls neue Berechnungen: Aggregation
5. View komponiert sich aus existierenden Komponenten

**Aufwand:** 1-3 Stunden.

### Neue KPI auf Übersicht
**Beispiel:** "Durchschnittliche Tage bis erster Interessent".
1. Aggregation hinzufügen
2. `<KPICard>` in `app/helios/page.tsx` einfügen

**Aufwand:** 30 Min.

### Neue Datenquelle
**Beispiel:** Google Ads.
1. Adapter `lib/helios/sources/google-ads.ts`
2. Environment Variables in Vercel
3. In Aggregations / Views nutzen

**Aufwand:** 2-4 Stunden.

### Style ändern (vier Schwere-Grade)

**Stufe 1 — Akzent oder Schrift wechseln**
`lib/helios/tokens.ts` öffnen, ändern, fertig. **1 Minute.**

**Stufe 2 — Komponenten-Look austauschen** (z.B. KPI-Karten wie Linear)
`lib/helios/components/kpi/KPICard.tsx` öffnen, JSX/Tailwind anpassen. Props/API nicht ändern. **30-60 Min pro Komponente.**

**Stufe 3 — Komplettes Theme** (Dark Mode oder Stil-Wechsel)
Zweite Token-Datei `tokensDark.ts` + `[data-theme="dark"]` in globals.css + Theme-Switcher. **4-8 Stunden.**

**Stufe 4 — Layout-Wechsel** (Sidebar weg, Tab-Nav oben)
`Sidebar.tsx` durch `TopNav.tsx` ersetzen, `app/helios/layout.tsx` anpassen. **2-4 Stunden.**

### Neue Server Action
**Beispiel:** "Listing manuell verlängern".
1. Funktion in `app/helios/actions.ts`
2. Audit-Log-Schreiben
3. Button mit `<form action={...}>` in der View
4. `revalidatePath`

**Aufwand:** 30-60 Min.

### Neuen Admin hinzufügen
Über `/helios/einstellungen` → "Admin hinzufügen" oder direkt in Supabase. **30 Sekunden.**

---

## Sprint-Plan

### Sprint 1 — Read-Only-Skelett
- [ ] Tabellen: `admin_users`, `business_events`, `helios_audit_log`
- [ ] `lib/helios/tokens.ts` mit allen Design-Tokens
- [ ] CSS-Variablen in `globals.css`
- [ ] Tailwind-Config erweitern
- [ ] `middleware.ts` Auth-Guard
- [ ] `lib/helios/auth.ts` mit `requireAdmin()`
- [ ] `lib/analytics/track.ts` Hybrid-Tracker
- [ ] **Komponenten-Bibliothek Grundgerüst:**
  - [ ] `primitives/` (Card, Badge, Button)
  - [ ] `kpi/KPICard.tsx`
  - [ ] `tables/DataTable.tsx`
  - [ ] `layout/Sidebar.tsx`, `Header.tsx`, `PageWrapper.tsx`
  - [ ] `feedback/Skeleton.tsx`, `EmptyState.tsx`
- [ ] Source-Adapter Stripe + Supabase (Read)
- [ ] View: Übersicht
- [ ] View: Kunden-Tabelle
- [ ] View: Listings-Tabelle
- [ ] Stripe-Webhook → schreibt parallel in `business_events`

### Sprint 2 — Erste Aktionen
- [ ] Server Actions: Refund, Listing-Status, ImmoScout-Status, E-Mail
- [ ] Detail-Views Kunde + Listing
- [ ] Audit-Log-Schreiben
- [ ] `feedback/Toast.tsx`, `ConfirmDialog.tsx`

### Sprint 3 — Funnels & Marge
- [ ] PostHog-, Anthropic-, Replicate-, Resend-Adapter
- [ ] `charts/` Komponenten
- [ ] View: Funnel
- [ ] View: Kosten
- [ ] Marge-Aggregation + Warnungen

### Sprint 4 — Operations
- [ ] View: Operations
- [ ] View: Verkäufe
- [ ] SLA-Tracking
- [ ] Makler-Stunden-Auslastung
- [ ] ImmoScout-Flatrate-Tracking
- [ ] View: Einstellungen + Admin-User-Verwaltung
- [ ] Theme-Switcher (Vorbereitung Dark-Theme)

---

## Was NICHT ins MVP

- Kein Mobile-Layout für `/helios`
- Kein Dark-Mode (System ist aber vorbereitet)
- Keine Drag-and-Drop-Dashboards
- Keine Reports/Exports außer CSV
- Keine Notifications
- Keine Mehrsprachigkeit

---

## Offene Fragen

- [ ] Anthropic Admin API-Zugriff für Token-Usage freischalten
- [ ] Replicate API-Key für Usage-Stats
- [ ] PostHog EU Personal API Key
- [ ] Vercel Environment Variables
- [ ] Backup-Strategie (Supabase PITR aktivieren)
- [ ] `makler_anfragen.bestaetigt_am` Column ergänzen für echtes SLA-Tracking — braucht parallel App-seitige Bestätigungs-UI für den Makler-Kollegen (Sprint 5)

---

## Hinweise für Claude Code

1. **Lies erst diese Datei vollständig**, dann DESIGN.md, PRD.md, brain.md
2. **Sprint 1 in der angegebenen Reihenfolge:** Tabellen → Tokens → Komponenten → Auth → Sources → Views
3. **PLAN bevor Code:** kurze Notiz was in welche Datei kommt
4. **Nach jedem Schritt:** Update in `brain.md` + Commit
5. **Bei Unsicherheit:** lieber fragen als raten

### Goldene Regeln

- **Tokens statt Hardcoded:** Niemals `#1B6B45`, `16px`, `gray-600` direkt. Immer Tokens / Tailwind aus Tokens.
- **Komponenten statt Inline-UI:** Erst prüfen ob Komponente existiert. Wenn nicht und wiederverwendbar → neu anlegen.
- **Server-first:** Daten in Server Components ziehen.
- **Drei Schichten respektieren:** Sources holen, Aggregations rechnen, Views zeigen. Keine Vermischung.
- **Audit-Log Pflicht:** Jede schreibende Aktion in `/helios` schreibt einen Eintrag.

HELIOS ist Arbeitsname. Touch-Points für Umbenennung: `app/helios/`, `lib/helios/`, Sidebar-Header, README.

---

*Spec v1.1 · du-bist-der-makler.de · Mai 2026 · Vertraulich*
