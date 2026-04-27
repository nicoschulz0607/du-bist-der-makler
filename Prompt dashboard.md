# Claude Code Prompt — Dashboard Grundgerüst
# du-bist-der-makler.de

Kopiere alles ab hier direkt in Claude Code.

---

## Kontext

Landing Page und Auth-Seiten (Login/Registrierung) existieren bereits.
Supabase Auth ist eingerichtet. Die Middleware schützt `/dashboard` bereits.

Jetzt wird das Dashboard-Grundgerüst gebaut — das ist der geschützte Bereich
nach dem Login. Lese zuerst `DESIGN.md` und `PRD.md` im Repo-Root bevor du
irgendetwas baust. Diese Dateien definieren Design-System und Feature-Anforderungen.

**Tech Stack:**
- Next.js App Router (Server + Client Components)
- Tailwind CSS + DESIGN.md Tokens
- Supabase (Auth + Postgres)
- TypeScript

---

## Schritt 1 — Supabase Tabellen anlegen

Führe diese SQL-Queries in Supabase SQL Editor aus (falls noch nicht vorhanden):

```sql
-- Users-Tabelle erweitern (paket_tier setzen)
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS raw_user_meta_data jsonb;

-- Profiles-Tabelle (öffentliche User-Daten)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  vorname TEXT,
  email TEXT,
  paket_tier TEXT CHECK (paket_tier IN ('starter', 'pro', 'premium')) DEFAULT NULL,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automatisch Profile anlegen bei Registrierung
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, vorname)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'vorname'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Listings
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('draft', 'aktiv', 'verkauft')) DEFAULT 'draft',
  objekttyp TEXT,
  adresse_strasse TEXT,
  adresse_plz TEXT,
  adresse_ort TEXT,
  wohnflaeche_qm INTEGER,
  zimmer NUMERIC(3,1),
  baujahr INTEGER,
  zustand TEXT,
  beschreibung TEXT,
  preis INTEGER,
  energieausweis_klasse TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checkliste Status
CREATE TABLE IF NOT EXISTS public.checkliste_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  aufgabe_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, aufgabe_id)
);

-- Row Level Security aktivieren
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkliste_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies: User sieht nur eigene Daten
CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "listings_own" ON public.listings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "checkliste_own" ON public.checkliste_status FOR ALL USING (auth.uid() = user_id);
```

---

## Schritt 2 — Datei-Struktur

Erstelle diese Struktur:

```
app/
  dashboard/
    layout.tsx          ← Dashboard Shell (Sidebar + Topbar)
    page.tsx            ← Übersicht (Server Component)
    schritte/
      page.tsx          ← Schritt-für-Schritt Ansicht
    objekt/
      page.tsx          ← Listing erstellen/bearbeiten
    expose/
      page.tsx          ← KI-Exposé [Pro+]
    preisrechner/
      page.tsx          ← KI-Preisrechner [Pro+]
    interessenten/
      page.tsx          ← CRM-Lite [Pro+]
    termine/
      page.tsx          ← Besichtigungskalender [Pro+]
    partner/
      page.tsx          ← Partner & Services [alle]
    einstellungen/
      page.tsx          ← Konto-Einstellungen

components/
  dashboard/
    Sidebar.tsx         ← Navigation links
    Topbar.tsx          ← Header mit User-Info
    FeatureCard.tsx     ← Feature-Kachel mit optionalem Blur
    BlurOverlay.tsx     ← Upgrade-CTA Overlay
    StepProgress.tsx    ← Fortschrittsanzeige
    StatusBanner.tsx    ← Grünes/gelbes Banner oben

lib/
  tier.ts               ← Tier-Hilfsfunktionen
  checklist.ts          ← Checklisten-Daten (statisch)
```

---

## Schritt 3 — Tier-Hilfsfunktionen `/lib/tier.ts`

```ts
export type Tier = 'starter' | 'pro' | 'premium' | null

export function canAccess(tier: Tier, required: 'starter' | 'pro' | 'premium'): boolean {
  if (!tier) return false
  const levels = { starter: 1, pro: 2, premium: 3 }
  return levels[tier] >= levels[required]
}

export function getTierLabel(tier: Tier): string {
  const labels = { starter: 'Starter', pro: 'Pro', premium: 'Premium' }
  return tier ? labels[tier] : 'Kein Paket'
}

export function getUpgradeTarget(tier: Tier): 'pro' | 'premium' | null {
  if (tier === 'starter') return 'pro'
  if (tier === 'pro') return 'premium'
  return null
}

export function getUpgradeText(tier: Tier): { title: string; sub: string; cta: string } | null {
  if (tier === 'starter') return {
    title: 'Mit Pro: KI-Exposé, Preisrechner und Interessenten-CRM',
    sub: 'Einmaliges Upgrade — kein Abo, keine versteckten Kosten.',
    cta: 'Upgrade auf Pro (499 €) →'
  }
  if (tier === 'pro') return {
    title: 'Mit Premium: ImmoScout-Listing, Bildverbesserung & Makler-Hotline',
    sub: 'Noch 200 € mehr — dein Inserat geht auf alle großen Portale.',
    cta: 'Upgrade auf Premium (699 €) →'
  }
  return null
}
```

---

## Schritt 4 — Dashboard Layout `/app/dashboard/layout.tsx`

Server Component. Liest User + Profil aus Supabase.
Übergibt `tier` und `vorname` als Props an Client-Komponenten.

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('vorname, paket_tier')
    .eq('id', user.id)
    .single()

  // Kein Paket → Onboarding
  if (!profile?.paket_tier) redirect('/onboarding')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar tier={profile.paket_tier} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar vorname={profile.vorname} tier={profile.paket_tier} />
        <main className="flex-1 p-7 max-w-5xl w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

## Schritt 5 — Sidebar `/components/dashboard/Sidebar.tsx`

Client Component. Props: `tier: Tier`.

**Navigation-Struktur:**

Abschnitt "Mein Verkauf":
- Übersicht → `/dashboard`
- Schritt-für-Schritt → `/dashboard/schritte` (Badge mit "2/8")
- Mein Objekt → `/dashboard/objekt`

Abschnitt "KI-Tools":
- KI-Exposé → `/dashboard/expose` — locked wenn Tier < Pro, Badge "Pro"
- Preisrechner → `/dashboard/preisrechner` — locked wenn Tier < Pro, Badge "Pro"
- KI-Chatbot → `/dashboard/chatbot` — immer verfügbar, grüner "Online"-Punkt

Abschnitt "Interessenten":
- Interessenten-CRM → `/dashboard/interessenten` — locked wenn Tier < Pro
- Besichtigungen → `/dashboard/termine` — locked wenn Tier < Pro

Abschnitt "Services":
- Partner & Services → `/dashboard/partner` — immer verfügbar
- Makler-Support → `/dashboard/support` — locked wenn Tier < Premium, Badge "Premium"

**Wichtig bei locked Nav-Items:**
- Nicht deaktiviert, sondern klickbar → beim Klick wird die jeweilige Seite
  geöffnet, die dann eine Blur-Preview zeigt (kein 404)
- Visuell: opacity-60, Lock-Icon rechts, Cursor normal

**Sidebar Footer:**
- User-Avatar (Initialen aus Vorname), Name, Tier-Badge
- Einstellungen-Link
- Ausloggen-Button (ruft `supabase.auth.signOut()` auf, redirect zu `/login`)

**Aktiver Zustand:** `usePathname()` für aktiven Nav-Link.

**Design-Tokens aus DESIGN.md verwenden:**
- Akzentfarbe: `#1B6B45`
- Aktiver Nav-Item: `bg-[#E8F5EE] text-[#1B6B45] font-medium`
- Sidebar-Breite: `w-60`
- Border-Right: `border-r border-gray-200`

---

## Schritt 6 — Topbar `/components/dashboard/Topbar.tsx`

Client Component. Props: `vorname: string`, `tier: Tier`.

- Links: Begrüßung ("Guten Morgen, {vorname} 👋") + Unterzeile ("Hier ist dein aktueller Stand")
- Rechts: Glocken-Icon (inaktiv für MVP) + Button "Inserat bearbeiten" → `/dashboard/objekt`
- Sticky top, `z-50`, weißer Hintergrund, Border-Bottom

**Tageszeit-Begrüßung:**
```ts
function getGreeting(name: string): string {
  const h = new Date().getHours()
  if (h < 12) return `Guten Morgen, ${name} 👋`
  if (h < 18) return `Guten Tag, ${name} 👋`
  return `Guten Abend, ${name} 👋`
}
```

---

## Schritt 7 — FeatureCard `/components/dashboard/FeatureCard.tsx`

Wiederverwendbare Kachel. Props:

```ts
interface FeatureCardProps {
  icon: React.ReactNode
  iconBg: string          // z.B. 'bg-purple-100 text-purple-700'
  title: string
  description: string
  href: string
  requiredTier: 'starter' | 'pro' | 'premium'
  currentTier: Tier
  badge?: string          // z.B. 'Pro', 'Premium'
}
```

**Wenn currentTier < requiredTier:**
- Karte ist trotzdem klickbar (Link zu href)
- Blur-Overlay darüber (backdrop-filter: blur(4px))
- Overlay zeigt: Lock-Icon + Tier-Name + "Upgrade"-Button
- Upgrade-Button → `/onboarding?upgrade=pro` oder `/onboarding?upgrade=premium`

**Wenn currentTier >= requiredTier:**
- Karte normal, hover: leichte Elevation + grüner Border
- Klick navigiert zu href

---

## Schritt 8 — Dashboard Übersicht `/app/dashboard/page.tsx`

Server Component. Liest aus Supabase:
- `profiles`: tier, vorname
- `listings`: erstes Listing des Users (falls vorhanden)
- `checkliste_status`: wie viele Aufgaben abgehakt

**Aufbau der Seite (von oben nach unten):**

### 8a. Status-Banner
- Grün wenn Listing `status = 'aktiv'`: "Dein Inserat ist live!"
- Gelb wenn Listing `status = 'draft'`: "X von 8 Schritten abgeschlossen"
- Grau wenn kein Listing: "Leg jetzt dein Objekt an"
- Rechts: CTA-Button ("Weiter →" oder "Jetzt anlegen")

### 8b. Stats-Row (3 Kacheln)
- Profilaufrufe (7 Tage) — für MVP: "—" wenn nicht live
- Anfragen gesamt — aus `interessenten` Tabelle zählen
- Tage bis Ablauf — aus `profiles.created_at` + 180 Tage berechnen

### 8c. Listing-Vorschau
- Wenn vorhanden: Objekttyp, Adresse, Preis, Status-Badge, Foto-Count
- Wenn nicht vorhanden: Leerzustand mit "Objekt anlegen"-Button
- Klick → `/dashboard/objekt`

### 8d. Portal-Status (nur wenn Listing aktiv)
- Chips: du-bist-der-makler.de (immer grün wenn aktiv),
  ImmoScout24 (grün nur bei Premium + aktiv), eBay Kleinanzeigen (grün nur bei Premium + aktiv)

### 8e. Feature-Grid (6 Kacheln, 3 Spalten)
Nutze `FeatureCard` für alle 6:

| Feature | Icon | Farbe | Tier |
|---|---|---|---|
| Schritt-für-Schritt | CheckSquare | grün | starter |
| KI-Chatbot 24/7 | MessageSquare | teal | starter |
| KI-Exposé-Generator | FileText | lila | pro |
| KI-Preisrechner | TrendingUp | blau | pro |
| Interessenten-CRM | Users | orange | pro |
| Makler-Support | Phone | rose | premium |

### 8f. Upgrade-Banner (wenn Tier < premium)
- Dunkelgrüner Gradient-Banner
- Text je nach Tier (aus `getUpgradeText()`)
- CTA-Button weiß auf grün

---

## Schritt 9 — Schritt-für-Schritt `/app/dashboard/schritte/page.tsx`

Server Component + Client-Interaktivität (Checkboxen).

**Statische Checklisten-Daten in `/lib/checklist.ts`:**

```ts
export interface ChecklistItem {
  id: string
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  requiredTier?: 'starter' | 'pro' | 'premium'
}

export interface ChecklistPhase {
  id: string
  title: string
  items: ChecklistItem[]
}

export const CHECKLIST: ChecklistPhase[] = [
  {
    id: 'vorbereitung',
    title: 'Phase 1 — Vorbereitung',
    items: [
      { id: 'konto_erstellt', title: 'Konto erstellt & Paket gebucht', description: 'Einmalzahlung abgeschlossen, E-Mail bestätigt' },
      { id: 'objekt_erfasst', title: 'Objekt-Grunddaten eingetragen', description: 'Adresse, Größe, Zimmer, Baujahr', actionLabel: 'Jetzt ausfüllen', actionHref: '/dashboard/objekt' },
      { id: 'preis_ermittelt', title: 'Marktwert eingeschätzt', description: 'KI-Preisrechner genutzt oder eigene Recherche', actionLabel: 'Preisrechner öffnen', actionHref: '/dashboard/preisrechner', requiredTier: 'pro' },
      { id: 'energieausweis', title: 'Energieausweis bestellt', description: 'Pflicht beim Verkauf — ab ca. 79 € über Partner', actionLabel: 'Partner öffnen', actionHref: '/dashboard/partner' },
    ]
  },
  {
    id: 'vermarktung',
    title: 'Phase 2 — Vermarktung',
    items: [
      { id: 'fotos_hochgeladen', title: 'Mindestens 5 Fotos hochgeladen', description: 'Mehr Fotos = mehr Klicks', actionLabel: 'Fotos verwalten', actionHref: '/dashboard/objekt' },
      { id: 'expose_erstellt', title: 'KI-Exposé generiert', description: 'Professionelles PDF in 20 Sekunden', actionLabel: 'Exposé erstellen', actionHref: '/dashboard/expose', requiredTier: 'pro' },
      { id: 'inserat_live', title: 'Inserat veröffentlicht', description: 'Auf du-bist-der-makler.de + Portalen', actionLabel: 'Inserat aktivieren', actionHref: '/dashboard/objekt' },
    ]
  },
  {
    id: 'besichtigungen',
    title: 'Phase 3 — Besichtigungen & Verhandlung',
    items: [
      { id: 'interessenten_verwaltet', title: 'Interessenten im CRM erfasst', description: 'Status, Notizen, Qualifizierung', actionLabel: 'CRM öffnen', actionHref: '/dashboard/interessenten', requiredTier: 'pro' },
      { id: 'besichtigungen_geplant', title: 'Besichtigungstermine geplant', description: 'Termine mit Bestätigung per E-Mail', actionLabel: 'Kalender öffnen', actionHref: '/dashboard/termine', requiredTier: 'pro' },
      { id: 'kaufangebot_erhalten', title: 'Schriftliches Kaufangebot erhalten', description: 'Finanzierungsbestätigung des Käufers vorliegt' },
    ]
  },
  {
    id: 'abschluss',
    title: 'Phase 4 — Kaufabschluss',
    items: [
      { id: 'notar_gewaehlt', title: 'Notar ausgewählt & Termin vereinbart', description: 'Regionaler Notar über Partnerliste', actionLabel: 'Notarempfehlung', actionHref: '/dashboard/partner' },
      { id: 'kaufvertrag_geprueft', title: 'Kaufvertragsentwurf erhalten & geprüft', description: 'Min. 2 Wochen vor Termin lesen' },
      { id: 'schluessel_uebergeben', title: 'Schlüsselübergabe & Übergabeprotokoll', description: 'Verkauf abgeschlossen 🎉' },
    ]
  }
]
```

**Seiten-Aufbau:**

1. Fortschrittsbalken oben (abgehakte Items / Gesamt, grüner Balken)
2. 8-teiliges Step-Grid (wie im Mockup) — visuell zeigt Phasen als Schritte
3. Aktuelle Phase aufgeklappt mit Checkboxen
4. Nächste Phase als Preview (zusammengeklappt, klappbar)
5. Checkboxen speichern Status in `checkliste_status` via Server Action

**Server Action für Checkbox:**
```ts
'use server'
async function toggleChecklistItem(aufgabeId: string, completed: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('checkliste_status').upsert({
    user_id: user.id,
    aufgabe_id: aufgabeId,
    completed,
    completed_at: completed ? new Date().toISOString() : null
  }, { onConflict: 'user_id,aufgabe_id' })
}
```

---

## Schritt 10 — Locked Feature Pages

Für alle gesperrten Features (Exposé, Preisrechner, CRM, Termine, Support):
Baue eine einheitliche Komponente `LockedPage` die gezeigt wird wenn Tier zu niedrig.

```tsx
// components/dashboard/LockedPage.tsx
interface LockedPageProps {
  featureName: string
  requiredTier: 'pro' | 'premium'
  description: string
  benefits: string[]
  upgradePrice: string
}
```

**Layout der Locked-Page:**
- Großes, leicht verblurtes Preview-Bild/Screenshot des Features (statisch)
- Darüber: weißes Card mit Lock-Icon, Feature-Name, Beschreibung
- Liste der Benefits (Bullet mit grünem Häkchen)
- Großer Upgrade-Button (Link zu `/onboarding?upgrade=pro` oder `...=premium`)
- Kleiner Link: "Zurück zur Übersicht"

Diese Seiten zeigen damit nicht einfach nur einen Fehler — sie verkaufen aktiv das Upgrade.

---

## Schritt 11 — Einstellungen `/app/dashboard/einstellungen/page.tsx`

Einfache Client-Seite mit:
- Vorname ändern (Supabase update)
- E-Mail anzeigen (nicht änderbar für MVP)
- Passwort ändern (via Supabase `updateUser`)
- Aktuelles Paket anzeigen + Laufzeit-Ende
- Ausloggen-Button
- Daten löschen (Account-Löschung) — für MVP: "Kontaktiere uns" Link

---

## Design-Regeln (aus DESIGN.md beachten)

- Sidebar: `w-60`, `bg-white`, `border-r border-gray-200`
- Akzentfarbe überall: `#1B6B45`, Hover: `#145538`
- Aktiver Nav-Link: `bg-[#E8F5EE] text-[#1B6B45] font-medium rounded-lg`
- Cards: `bg-white border border-gray-200 rounded-xl`
- Feature-Kacheln: Hover `border-[#1B6B45] shadow-sm -translate-y-px`
- Blur-Overlay: `backdrop-blur-sm bg-white/60`
- Fortschrittsbalken: `bg-[#1B6B45]`
- Badges: Pro = lila (`bg-purple-100 text-purple-700`), Premium = amber (`bg-amber-100 text-amber-700`)
- Font: Inter (aus DESIGN.md)
- Section-Labels: `text-xs font-semibold text-gray-500 uppercase tracking-wider`

---

## Was du NICHT bauen sollst (kommt später)

- Kein KI-Exposé-Generator (nur Locked-Page mit Upgrade-CTA)
- Kein KI-Preisrechner (nur Locked-Page)
- Kein Chatbot-Interface (nur Platzhalter-Seite)
- Kein CRM mit echten Daten (nur Locked-Page oder leere State)
- Kein Besichtigungskalender (nur Locked-Page)
- Kein Stripe Upgrade-Flow (Link geht zu /onboarding, der Flow kommt separat)
- Keine Foto-Upload-Logik auf der Objekt-Seite (nur Formular-Skeleton)

---

## Manueller Test-Workflow

Nach dem Build teste folgendes manuell:

1. In Supabase SQL Editor: `UPDATE public.profiles SET paket_tier = 'starter' WHERE email = 'deine@email.de'`
2. Einloggen → Dashboard öffnet sich
3. Exposé-Kachel klicken → Blur + Upgrade-CTA sichtbar
4. In Supabase: `UPDATE public.profiles SET paket_tier = 'pro' WHERE email = 'deine@email.de'`
5. Dashboard neu laden → Exposé + Preisrechner + CRM entsperrt, Support noch gesperrt
6. Auf Premium setzen → alles entsperrt, Portal-Dots grün

Kein Stripe nötig für diesen Test — direkt in Supabase den Tier setzen.

---

## Abschluss-Check

Wenn fertig:
1. `tsc --noEmit` — keine TypeScript-Fehler
2. `/dashboard` ohne Login → redirect zu `/login` ✓
3. `/dashboard` ohne Paket → redirect zu `/onboarding` ✓
4. Alle 6 Feature-Kacheln sichtbar, Blur korrekt je nach Tier ✓
5. Schritt-für-Schritt: Checkboxen speichern Zustand in Supabase ✓
6. Sidebar-Navigation: aktiver Link korrekt highlighted ✓
7. Mobile: Sidebar ausgeblendet (kommt später mit Hamburger-Menu) ✓