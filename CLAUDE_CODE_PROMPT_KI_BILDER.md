# Claude Code Prompt: KI-Bildtools Feature einbinden (UX-First, Mock-Backend)

> **Kontext für Claude Code:** Du arbeitest am Next.js-Projekt `du-bist-der-makler.de`. Bevor du startest, lies `DESIGN.md`, `PRD.md` und `brain.md` im Repo-Root komplett durch. Dieses Feature ist Teil des Premium-Pakets und wird in zwei Phasen gebaut. **Diese Phase 1 baut nur die UX mit Mock-Daten** — keine echten API-Calls. fal.ai-Integration kommt in Phase 2.

---

## Ziel dieser Aufgabe

Baue die komplette UI für das "KI-Bildtools"-Feature im Dashboard. Die UI muss sich anfühlen wie ein fertiges Produkt — mit Loading-States, Vorher/Nachher-Vergleich, Stilauswahl etc. — aber alle Generierungen werden zunächst **gemockt** (Timer + Beispielbilder zurückgeben). Damit kann das Feature visuell getestet werden, bevor echte API-Kosten entstehen.

---

## Pflichtlektüre vor dem ersten Codezeile

1. `DESIGN.md` — Design-Tokens, Spacing, Typografie, Akzentfarbe `#1B6B45`
2. `PRD.md` — speziell Abschnitt 4.3 (KI-Tools) und 4.2 (Listing-Verwaltung)
3. `brain.md` — Kontext zu Paketen und Strategie
4. Bestehende Komponenten unter `/components/` durchsehen — verwende bestehende Pattern, baue nicht parallel neu

**Wenn du etwas nicht in den Docs findest, frage nach. Rate nicht.**

---

## Feature-Scope Phase 1 (diese Aufgabe)

### Drei Tools, drei Tabs auf einer Seite

**Route:** `/dashboard/bildtools`

**Tab 1: Foto-Aufwertung** *(verfügbar in Pro + Premium)*
- Mehrfach-Upload von Fotos (drag & drop oder Button)
- Liste der hochgeladenen Bilder mit Thumbnail
- Button "Alle aufwerten" → simuliert Verarbeitung pro Bild (1-3 Sek pro Bild)
- Vorher/Nachher-Slider pro Bild (z.B. mit `react-compare-slider`)
- Download-Button pro Bild + "Alle herunterladen" als ZIP

**Tab 2: Virtual Staging** *(nur Premium — bei Pro/Basic geblurred mit Upgrade-CTA)*
- Single-Upload eines leeren Raum-Fotos
- **Pflicht-Häkchen:** "Dieser Raum ist tatsächlich leer — ich verstehe, dass Virtual Staging nur für leerstehende Räume zulässig ist." (Disclaimer-Text exakt so übernehmen)
- Stilauswahl als Karten-Grid (4 Karten, je mit Beispielbild + Stilname):
  - Modern
  - Skandinavisch
  - Klassisch
  - Familie
- Button "Staging generieren" — disabled bis Häkchen gesetzt + Stil gewählt
- Loading-State mit Fortschrittstext ("Möbel werden platziert…", "Beleuchtung wird angepasst…", "Finalisierung…" — wechselnd alle 3 Sek)
- Ergebnis-Anzeige: 3 Varianten nebeneinander, Kunde wählt Favorit
- Watermark "Visualisierung — leerer Raum gestaged" auf Mock-Output sichtbar einrendern

**Tab 3: Außenaufnahmen** *(nur Premium)*
- Upload einzelnes Bild
- Zwei Toggle: "Himmel ersetzen" / "Twilight (Tag → Dämmerung)"
- Auswahl mindestens eines der Toggles erforderlich
- Button "Aufwerten"
- Loading-State + Vorher/Nachher

---

## Mock-Logik (Phase 1)

Erstelle `/lib/mock-image-api.ts` mit drei Funktionen:

```ts
mockEnhancePhoto(file: File): Promise<string>          // 1-3s delay, returns URL aus /public/mocks/enhanced/
mockStageRoom(file: File, style: string): Promise<string[]>  // 8-12s delay, returns 3 URLs
mockOutdoorEnhance(file: File, options): Promise<string>     // 5-8s delay, returns URL
```

Lege unter `/public/mocks/` Beispiel-Output-Bilder an (kannst du mit Platzhaltern vom Stack-Foto-Service generieren oder Beispielbilder einbinden, die offensichtlich Mocks sind — Wasserzeichen "MOCK" drauf rendern).

**Wichtig:** Die Mock-Funktionen sollen die echte API-Signatur vorwegnehmen. In Phase 2 wird nur die Implementierung getauscht, nicht der Aufruf.

---

## Paket-Gating (Feature-Flags)

Lies das aktive Paket des Users aus Supabase (`users.paket_tier`). Verwende bestehende Logik falls vorhanden, sonst:

```ts
// /lib/feature-gates.ts
export function canAccessFeature(tier: string, feature: 'enhance' | 'staging' | 'outdoor'): boolean {
  if (feature === 'enhance') return ['pro', 'premium'].includes(tier);
  if (feature === 'staging' || feature === 'outdoor') return tier === 'premium';
  return false;
}
```

**Gesperrte Tabs:** als Blur-Preview mit Overlay-CTA "Upgrade auf Premium um Virtual Staging zu nutzen → 219 € statt Pro 169 €" (Aufpreis dynamisch berechnet aus aktueller Pricing-Tabelle).

---

## Limits anzeigen (auch wenn nicht enforced in Phase 1)

Für Premium aktuell vorgesehen: unbegrenzt — aber zeige im UI ein dezentes Counter-Badge:

> "Bisher in dieser Laufzeit: 7 Bilder aufgewertet, 3 Räume gestaged"

Das gibt dem Kunden Gefühl von Transparenz und macht später Hard-Limits einfach einbaubar.

Pro-User bei Foto-Aufwertung: Limit "30 Bilder pro Inserat" sichtbar als "12 von 30 verbraucht" anzeigen.

---

## UI/UX Requirements

- **Mobile-first.** Alle Views auf 375px Breite vollständig nutzbar.
- **Touch-Targets** mindestens 44×44 px (iOS-Standard).
- **Loading-States** sind Pflicht — niemals einen "klick und warte ohne Feedback"-Moment.
- **Fehler-Handling** für: Upload zu groß (>10MB), falsches Format, Upload-Fehler. Inline-Fehlermeldungen, keine Alerts.
- **Progressive Disclosure:** Erweiterte Optionen (z.B. Stilstärke-Slider) standardmäßig versteckt, nur bei Klick auf "Erweitert" sichtbar.
- **Disclaimer immer sichtbar bei Staging-Tab,** auch wenn schon abgehakt.
- **Akzentfarbe `#1B6B45`** für CTAs, Hover `#145538`, helle Hintergründe `#E8F5EE`.
- **Inter-Font** mit negative letter-spacing auf Headlines (siehe DESIGN.md).
- **Keine Emojis** in UI-Texten — der Brand ist warmherzig-professionell, nicht verspielt.

---

## State-Management

Verwende **Zustand** wenn schon im Projekt verwendet, sonst React Server Components mit URL-State (`useSearchParams`) für Tab-Wechsel und `useState` lokal für Tool-State. Keine globale State-Lib für ein einzelnes Feature einführen.

Generierte Mock-URLs in Supabase Storage unter `/listings/{user_id}/{listing_id}/ai-images/` ablegen — auch in Phase 1, damit der Datenmodell-Pfad in Phase 2 unverändert bleibt.

---

## Datenbank: Erweiterung

Füge zur Supabase neue Tabelle `bild_jobs`:

```sql
create table bild_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  listing_id uuid references listings(id),
  job_type text check (job_type in ('enhance', 'staging', 'outdoor')) not null,
  status text check (status in ('pending', 'processing', 'done', 'failed')) not null default 'pending',
  input_url text not null,
  output_urls text[],
  metadata jsonb,  -- für Stil, Optionen etc.
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

-- RLS: User sieht nur eigene Jobs
alter table bild_jobs enable row level security;
create policy "Users see own bild_jobs" on bild_jobs for all using (auth.uid() = user_id);
```

Migration als `/supabase/migrations/[timestamp]_bild_jobs.sql` ablegen.

---

## Tests

- **Unit-Tests** für `feature-gates.ts` (alle Tier × Feature Kombinationen)
- **Unit-Tests** für `mock-image-api.ts` (gibt URLs zurück, hält Delay ein)
- **E2E-Test** (Playwright) für den Happy-Path Foto-Aufwertung: Upload → Generieren → Vorher/Nachher sichtbar → Download

Keine Tests für UI-Details (zu fragil), aber State-Übergänge testen.

---

## Was NICHT in dieser Phase

- ❌ Echte fal.ai-Integration
- ❌ Stripe-Logik für Add-on-Bildkontingente
- ❌ Decluttering / Möbel-Entfernung
- ❌ Renovierungs-Visualisierung
- ❌ Mehrsprachigkeit
- ❌ Email-Notifications wenn Job fertig (kommt mit echter API)

---

## Akzeptanzkriterien (für meine Abnahme)

- [ ] Route `/dashboard/bildtools` ist erreichbar, prüft Login + aktives Paket
- [ ] Drei Tabs sichtbar, Gating funktioniert (Basic sieht nur Foto-Aufwertung sichtbar, Rest geblurred)
- [ ] Foto-Aufwertung: Upload → Mock-Generierung → Vorher/Nachher-Slider funktioniert
- [ ] Virtual Staging: Disclaimer-Häkchen erforderlich, 4 Stile wählbar, 3 Mock-Varianten als Output, Watermark sichtbar
- [ ] Außenaufnahmen: Mindestens ein Toggle erforderlich, Mock-Output mit Vorher/Nachher
- [ ] Mobile-Layout sauber auf 375px und 414px
- [ ] Counter-Badge zeigt verbrauchte Bilder pro Tool
- [ ] Tabelle `bild_jobs` ist angelegt mit RLS
- [ ] DESIGN.md-Tokens sind eingehalten (kein hartkodiertes Grün, keine fremden Fonts)
- [ ] Mock-Funktionen sind so geschrieben, dass nur die Implementierung getauscht werden muss in Phase 2

---

## Workflow-Empfehlung an Claude Code

1. Erst lesen (DESIGN.md, PRD.md, brain.md, bestehende Components)
2. Dann **PLAN.md** schreiben mit konkreter Komponentenstruktur und Datei-Liste
3. Plan mit Nico abstimmen (Pause einlegen, fragen ob OK)
4. Erst dann coden
5. Nach jedem Tab Selbsttest mit Playwright-Screenshot, anhängen an Antwort

**Bei Unklarheit: fragen, nicht raten.** Lieber 2 Klärungsfragen als 4h falsche Richtung.

---

*Erstellt: 09.05.2026 · Phase 1 Mock-UX · Phase 2 (fal.ai) folgt nach Mock-Abnahme*
