# Claude Code Prompt: KI-Bildtools Feature — UX OVERHAUL

> **An Claude Code:** Dieses Dokument ersetzt den vorherigen Prompt für `/dashboard/bildtools`. Der bisher gebaute Plan war zu funktional — die UI verkauft sich nicht selbst und erklärt dem Nutzer nicht, was die Tools tatsächlich tun. Diese Version baut das ganze Feature als **selbsterklärendes, aspirational UI** neu auf.
>
> **Pflichtlektüre vor erstem Code:** `DESIGN.md`, `PRD.md`, `brain.md`. Sieh dir auch die bestehende Sidebar an (`components/dashboard/Sidebar.tsx`) für Navigationsmuster.

---

## Was am bisherigen UI nicht stimmt

Der aktuelle Stand zeigt drei Tabs (Foto-Aufwertung, Virtual Staging, Außenaufnahmen) und eine leere Drop-Zone. Probleme:

1. **Niemand weiß, was die Tabs konkret tun.** "Virtual Staging" ist Fachjargon. "Außenaufnahmen" sagt nichts über Funktion.
2. **Riesige leere Fläche** zwischen Drop-Zone und Tab-Bar. Wirkt halbfertig.
3. **Keine visuelle Demo** — der Kunde sieht nicht, was passieren wird, bevor er hochlädt.
4. **Locked Features sind unsichtbar.** Pro/Basic-User wechseln in den Tab und sehen entweder ein voll funktionsfähiges Feature (Bug) oder gar nichts (verschenktes Upsell-Potenzial).

## Die neue Logik: Jeder Tab ist eine Mini-Sales-Page

Vor dem ersten Upload zeigt jeder Tab dem Nutzer:

1. **Vorher/Nachher-Beispielbild** (interaktiver Slider mit echten Beispielbildern) — die zentrale Demonstration. Der Kunde versteht in 2 Sekunden was passiert.
2. **Was bringt's** — 1 Headline + 2-3 konkrete Vorteile als Kurzliste mit Icons (kein Marketing-Geschwätz, sondern Fakten)
3. **So funktioniert's** — 3 Mini-Schritte mit Icons (Upload → KI verarbeitet → Vorher/Nachher-Vergleich)
4. **Drop-Zone** — größer, prominenter als bisher, mit klarem CTA-Text
5. **Counter** dezent unter Drop-Zone

Nach dem ersten erfolgreichen Upload wird die Hero-Sektion eingeklappt und der Nutzer sieht stattdessen seine Verarbeitungs-Liste. Eine kleine Toggle-Option "Erklärung wieder anzeigen" am oberen Rand für Wiedereinsteiger.

## Locked Tabs: Sichtbar, aber nicht nutzbar

Pro/Basic-Nutzer können den Premium-Tab öffnen und sehen:

- **Vorher/Nachher-Demo** voll sichtbar und interaktiv
- **Vorteilsbeschreibung** voll lesbar
- **Drop-Zone** mit transparenter Glasplatte überlagert (CSS `backdrop-filter: blur(2px)` + leichte Abdunklung)
- **Mittig auf der Glasplatte:** Upgrade-CTA als Card
  - Headline: z.B. "Virtual Staging gibt's mit Premium"
  - Sub: konkreter Mehrwert in einem Satz
  - Preisvergleich: "Aufpreis zu deinem aktuellen Pro-Paket: nur 50 € für 1 Monat / 120 € für 3 Monate / 200 € für 6 Monate"
  - CTA-Button: "Auf Premium upgraden"

Das Prinzip: **Der Nutzer soll fühlen, was er verpasst** — nicht nur lesen, dass es das gibt.

---

## Komponenten-Aufbau

### Route bleibt: `/dashboard/bildtools`

### Datei-Struktur (überarbeitet)

```
app/dashboard/bildtools/
├── page.tsx                              # Server: auth + tier + counts + sample data
├── BildtoolsClient.tsx                   # Client: tab switcher + URL state
├── tabs/
│   ├── FotoAufwertung.tsx               # Tab 1
│   ├── VirtualStaging.tsx                # Tab 2
│   └── Aussenaufnahmen.tsx               # Tab 3
└── components/
    ├── ToolHero.tsx                      # NEU: Hero-Sektion pro Tab
    ├── BeforeAfterSlider.tsx             # Custom slider (für Hero UND Ergebnisse)
    ├── BenefitList.tsx                   # NEU: Icon-basierte Vorteilsliste
    ├── HowItWorks.tsx                    # NEU: 3-Schritt-Erklärung
    ├── FileDropZone.tsx                  # Bestehend, aber visuell aufgewertet
    ├── LockedOverlay.tsx                 # NEU: Glasplatte + Upgrade-CTA (ersetzt LockedTabOverlay)
    └── StyleCard.tsx                     # NEU: Stil-Auswahl-Karte für Staging
```

### Beispielbilder unter `/public/samples/`

Lege dort folgende Dateien an (kann erstmal Platzhalter sein, später durch echte Beispiele ersetzen — wichtig ist die Datei-Struktur):

```
/public/samples/
├── enhance-before.jpg          # dunkles, mäßiges Innenraumfoto
├── enhance-after.jpg           # selbe Aufnahme aufgehellt, geschärft
├── staging-empty-room.jpg      # leerer Raum
├── staging-modern.jpg          # selber Raum mit modernen Möbeln
├── staging-skandinavisch.jpg   # selber Raum, skandinavischer Stil
├── staging-klassisch.jpg       # selber Raum, klassischer Stil
├── staging-familie.jpg         # selber Raum, familiengerecht
├── outdoor-before.jpg          # graues Außenfoto
├── outdoor-sky.jpg             # mit blauem Himmel
└── outdoor-twilight.jpg        # zur Dämmerung gewandelt
```

Bis echte Bilder geliefert werden, nutze Platzhalter mit klar erkennbarem "MOCK"-Wasserzeichen.

---

## Im Detail: ToolHero-Komponente

Die zentrale Komponente, die jeder Tab vor dem Upload anzeigt.

```tsx
type ToolHeroProps = {
  title: string;                    // z.B. "Foto-Aufwertung"
  subtitle: string;                 // z.B. "Aus okay wird wow."
  beforeImage: string;
  afterImage: string;
  benefits: { icon: ReactNode; text: string }[];
  steps: { icon: ReactNode; title: string; description: string }[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
};
```

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  [Vorher/Nachher-Slider — full-width, max-h: 380px]    │
│                                                         │
└─────────────────────────────────────────────────────────┘

  Foto-Aufwertung
  Aus okay wird wow.

  Was bringt's
  ✓ Helle, scharfe Fotos verkaufen 73 % schneller (NAR)
  ✓ Automatischer Weißabgleich, HDR-Look in Sekunden
  ✓ Funktioniert auch mit Handy-Aufnahmen

  So funktioniert's
  [1] Fotos hochladen     [2] KI verarbeitet     [3] Vorher/Nachher
       (max. 30 Bilder)     (3 Sek pro Bild)        (Slider-Vergleich)

  ▼ Erklärung minimieren
```

Wenn `collapsed === true`: nur eine schmale Leiste mit "Erklärung anzeigen ▼" und der Drop-Zone direkt darunter.

---

## Inhalte pro Tab

### Tab 1: Foto-Aufwertung

- **Title:** Foto-Aufwertung
- **Subtitle:** Aus okay wird wow.
- **Benefits:**
  - Helle, scharfe Fotos verkaufen 73 % schneller (NAR-Studie)
  - Automatischer Weißabgleich, schärfere Details, ausgewogene Belichtung
  - Funktioniert auch mit Handy-Aufnahmen
- **Steps:**
  - Fotos hochladen (max. 30 Bilder)
  - KI verarbeitet jedes Bild (3 Sek)
  - Vorher/Nachher vergleichen, einzeln oder alle herunterladen
- **Verfügbar in:** Pro + Premium

### Tab 2: Virtual Staging

- **Title:** Virtual Staging
- **Subtitle:** Leere Räume zum Wohnen erweckt.
- **Benefits:**
  - Möblierte Räume erzielen laut Studien 1–5 % höhere Verkaufspreise
  - Wähle aus 4 Einrichtungsstilen — passend zu deiner Zielgruppe
  - Markt-Vergleichspreis: 16–40 € pro Bild — bei dir inklusive
- **Steps:**
  - Foto eines leeren Raums hochladen
  - Stil auswählen (Modern, Skandinavisch, Klassisch, Familie)
  - 3 Varianten erhalten — Favorit auswählen und herunterladen
- **Disclaimer (immer sichtbar, auch nach Upload):** "Virtual Staging ist nur für tatsächlich leerstehende Räume zulässig. Bei bewohnten Räumen entsteht Täuschungsgefahr gegenüber Käufern."
- **Verfügbar in:** Premium (Pro/Basic sehen Demo + Upgrade-Overlay)

### Tab 3: Außenaufnahmen

- **Title:** Außenaufnahmen aufwerten
- **Subtitle:** Auch bei grauem Himmel.
- **Benefits:**
  - Twilight-Fotos erzeugen laut Studien 35 % mehr Klicks
  - Grauer Himmel wird zum Sommertag — in Sekunden
  - Automatische Erkennung was geht und was nicht (kein Übermalen von Personen oder Schildern)
- **Steps:**
  - Außenfoto hochladen
  - Toggle wählen: Himmel ersetzen und/oder Twilight-Effekt
  - Vorher/Nachher vergleichen
- **Verfügbar in:** Premium

---

## LockedOverlay-Komponente

Ersetzt die bisherige `LockedTabOverlay`. Wichtige Unterschiede:

- **Wird NICHT über dem ganzen Tab gerendert.** Nur über der Drop-Zone (Hero bleibt voll sichtbar und interaktiv).
- **Verwendet `pointer-events: none` auf dem Hintergrund**, damit Vorher/Nachher-Slider auch im gesperrten Zustand bedienbar bleibt.
- **CTA-Card mittig auf der Glasplatte**, bestimmt Höhe automatisch.

```tsx
type LockedOverlayProps = {
  feature: 'staging' | 'outdoor';
  currentTier: Tier;
  // Aufpreis dynamisch je Laufzeit
  upgradeOptions: { duration: 1 | 3 | 6; priceDiff: number }[];
};
```

**Visuell:**

```
┌─ Drop-Zone-Bereich ─────────────────────────────────┐
│  ░░░░░░░░░ [Glasplatte mit blur(2px)] ░░░░░░░░░░░░ │
│                                                     │
│       ┌──────────────────────────────┐              │
│       │  [Lock-Icon]                 │              │
│       │                              │              │
│       │  Virtual Staging gibt's      │              │
│       │  mit Premium                 │              │
│       │                              │              │
│       │  Möblierte Räume verkaufen   │              │
│       │  schneller — wähle aus 4     │              │
│       │  Stilen.                     │              │
│       │                              │              │
│       │  Aufpreis je nach Laufzeit:  │              │
│       │  • 1 Monat: +50 €            │              │
│       │  • 3 Monate: +120 €          │              │
│       │  • 6 Monate: +200 €          │              │
│       │                              │              │
│       │  [Auf Premium upgraden]      │              │
│       └──────────────────────────────┘              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

CTA-Button-Klick führt zu `/dashboard/einstellungen/paket` (oder bestehender Upgrade-Route — Claude Code soll prüfen welche existiert; falls keine: zu `/#preise` auf der Landing Page als Fallback).

---

## Counter-Badge: Premium = "unbegrenzt"

Aktuell zeigt der Counter "0 Bilder aufgewertet · unbegrenzt". Das ist OK, aber psychologisch stärker:

```
Diese Laufzeit: 7 Bilder aufgewertet
                ─── von unbegrenzt ───
```

(Untere Linie als dezentes Detail, nicht aufdringlich.)

Pro-Nutzer auf Foto-Tab: zeige "12 von 30 verbraucht" als Pro-Cap-Indikator.

---

## Beispielbilder im Hero — wenn echte fehlen

Solange echte Vorher/Nachher-Beispiele fehlen:

- Verwende ein Beispielbild aus `/public/samples/` mit MOCK-Wasserzeichen
- Über den Slider lege ein Banner: "Beispielbild — echte Beispiele folgen"
- Im Phase-2-Switch werden die Beispielbilder durch echte ersetzt; UI ändert sich nicht

---

## Mobile-Verhalten (375px)

- ToolHero: Vorher/Nachher-Slider full-width, Benefits und Steps untereinander statt nebeneinander
- StyleCard-Grid (Staging): 2×2 statt 4 nebeneinander
- LockedOverlay: CTA-Card nimmt fast volle Breite ein (16px Außenabstand)
- Drop-Zone: mindestens 200px Höhe

---

## Was bleibt vom alten Plan

- Mock-API-Layer (`lib/mock-image-api.ts`) bleibt
- DB-Tabelle `bild_jobs` bleibt, RLS bleibt
- Zentrale `lib/pricing.ts` als Single Source of Truth (war im Approval-Feedback gefordert)
- Counter-Filter über `users.paket_started_at` (auch im Approval gefordert — falls Spalte noch nicht existiert, in derselben Migration ergänzen)
- TypeScript-Interface für `bild_jobs.metadata`:

```ts
type BildJobMetadata = 
  | { type: 'enhance' }
  | { type: 'staging'; style: 'modern' | 'skandinavisch' | 'klassisch' | 'familie' }
  | { type: 'outdoor'; himmel: boolean; twilight: boolean };
```

- "Alle herunterladen" als ZIP NICHT in Phase 1 (mit JSZip in Phase 2)
- TODO-Kommentar für Phase-2-Watermark-Rendering im Mock-Code

---

## Was Claude Code zuerst tun soll

1. **Lesen:** `DESIGN.md`, `PRD.md`, `brain.md`, `components/dashboard/Sidebar.tsx`, `lib/feature-gates.ts` (falls existiert), bestehende Komponenten unter `components/`
2. **Aktualisierten Plan schreiben:** `docs/PLAN_BILDTOOLS_V2.md` mit:
   - Komponenten-Hierarchie
   - Datei-Liste
   - Datenfluss page.tsx → BildtoolsClient → Tab → ToolHero/Drop-Zone/Result
   - Pricing-Source (zentrale `lib/pricing.ts`)
   - Open Questions (z.B. Upgrade-Route)
3. **Auf Approval warten** vor erstem Code
4. **Nach Approval:** in Branch `feature/ki-bildtools-phase1` arbeiten
5. **Pro Tab:** nach Implementierung Playwright-Screenshot machen und an Antwort anhängen
6. **Final:** PR mit Screenshots aller drei Tabs (Premium-Sicht + Pro-Sicht für Staging und Outdoor)

---

## Akzeptanzkriterien (überarbeitet)

- [ ] Jeder Tab zeigt vor erstem Upload eine vollständige Hero-Sektion (Vorher/Nachher + Benefits + Steps)
- [ ] Vorher/Nachher-Slider auch in Locked-Zustand bedienbar
- [ ] Locked Tabs zeigen Demo + Vorteile, nur Drop-Zone ist überlagert
- [ ] LockedOverlay zeigt dynamische Aufpreise je Laufzeit aus zentraler `lib/pricing.ts`
- [ ] Hero ist nach erstem Upload einklappbar, mit "Erklärung anzeigen"-Toggle
- [ ] Counter zeigt "X von unbegrenzt" für Premium, "X von 30" für Pro
- [ ] Disclaimer-Text auf Staging-Tab dauerhaft sichtbar (nicht nur Häkchen)
- [ ] Mobile (375px): Hero-Inhalte umgebrochen, alle Touch-Targets ≥ 44×44px
- [ ] DESIGN.md-Tokens eingehalten (`#1B6B45`, Inter, 16-20px Card-Radius, 3-Layer-Shadow)
- [ ] Keine Emojis, keine fremden Fonts, kein hartkodiertes Pricing
- [ ] Build clean, TypeScript strict, alle drei Tabs Playwright-getestet

---

*Erstellt: 09.05.2026 · UX Overhaul · Ersetzt Plan v1*
