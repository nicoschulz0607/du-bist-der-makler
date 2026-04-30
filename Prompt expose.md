# CLAUDE.md — du-bist-der-makler.de
# Master Prompt für Claude Code

> Dieses Dokument liegt im Repo-Root und wird von Claude Code automatisch
> bei jedem Start eingelesen. Es enthält alles was du über dieses Projekt
> wissen musst — Vision, Stack, Regeln, Patterns, Konventionen.
> Lies es vollständig bevor du eine einzige Zeile Code schreibst.

---

## 1. Projekt-Kontext

**du-bist-der-makler.de** ist eine SaaS-Plattform für privaten Immobilienverkauf in Deutschland.

**Kern-Versprechen:** *Du zahlst einmal. Du verkaufst selbst. Wir begleiten dich dabei.*

Private Immobilienverkäufer haben heute zwei schlechte Optionen: teurer Makler (3–6% Provision)
oder Listing-Plattform ohne jede Begleitung. Wir füllen die Lücke dazwischen — mit KI-Tools,
Schritt-für-Schritt-Begleitung und echtem Makler-Support für einen einmaligen Festpreis.

**Wettbewerbs-Kontext:**
- Hauptwettbewerber: `ohne-makler.net` — hat telefonischen Support abgeschafft, kein CRM,
  kein KI, buggy Nachrichten-System, keine App. Das sind unsere Angriffspunkte.
- Wir sind grün (`#1B6B45`), ohne-makler.net ist blau — bewusste visuelle Differenzierung.
- Struktureller Kostenvorteil: Kollege hat ImmoScout-Flatrate (600€/Monat, unbegrenzte Inserate).
  Break-Even bei ~5 Premium-Kunden.

**Pakete & Preise (unveränderlich — nicht eigenmächtig anpassen):**

| Paket    | Preis | Features                                                          |
|----------|-------|-------------------------------------------------------------------|
| Starter  | 299€  | Listing + Checkliste + KI-Chatbot                                 |
| Pro      | 499€  | + KI-Exposé, Preisrechner, CRM-Lite, Energieausweis-Partner      |
| Premium  | 699€  | + ImmoScout/Kleinanzeigen Listing, KI-Bildverbesserung, Makler-Support |
| Add-on   | 50€/h | Makler-Stunde (buchbar für alle; Premium: erste Stunde inklusive) |

Laufzeit immer 6 Monate. Kein Abo. Keine automatische Verlängerung.

---

## 2. Tech Stack (verbindlich)

| Bereich       | Tool                  | Version / Hinweis                            |
|---------------|-----------------------|----------------------------------------------|
| Framework     | Next.js               | App Router, Server Components, TypeScript     |
| Styling       | Tailwind CSS          | Utility-first, Design-Tokens aus DESIGN.md   |
| Datenbank     | Supabase              | Postgres + Auth + Storage + Realtime         |
| E-Mail        | Resend                | Transaktional + Interessenten-Forwarding      |
| Payment       | Stripe                | Einmalzahlung + Webhooks                     |
| KI (Text)     | Claude API            | `claude-sonnet-4-20250514` — Exposé, Chatbot, Preisrechner |
| KI (Bilder)   | Replicate API         | Bildverbesserung (nur Premium)               |
| Hosting       | Vercel                | Zero-Config, Preview-URLs                    |
| Automatisierung | n8n (self-hosted)   | Onboarding-Flows, E-Mail-Sequenzen           |

**Niemals ohne Absprache hinzufügen:** neue Datenbanken, andere Auth-Systeme,
CSS-Frameworks außer Tailwind, andere KI-Provider außer Claude/Replicate.

---

## 3. Projektstruktur (Next.js App Router)

```
/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    # Landing Page
│   │   ├── login/page.tsx
│   │   ├── registrieren/page.tsx
│   │   ├── inserate/[slug]/page.tsx    # Öffentliche Inserat-Seite
│   │   ├── impressum/page.tsx
│   │   ├── datenschutz/page.tsx
│   │   └── agb/page.tsx
│   ├── onboarding/
│   │   └── page.tsx                    # Paket wählen + Stripe Checkout
│   └── dashboard/
│       ├── page.tsx                    # Übersicht
│       ├── objekt/page.tsx             # Listing erstellen/bearbeiten
│       ├── expose/page.tsx             # KI-Exposé-Generator [Pro+]
│       ├── preisrechner/page.tsx       # KI-Preisrechner [Pro+]
│       ├── interessenten/page.tsx      # CRM-Lite [Pro+]
│       ├── termine/page.tsx            # Besichtigungskalender [Pro+]
│       ├── checkliste/page.tsx         # Checkliste [alle]
│       ├── partner/page.tsx            # Partner-Services [alle]
│       └── einstellungen/page.tsx
├── components/
│   ├── ui/                             # Basiskomponenten (Button, Input, Card…)
│   ├── landing/                        # Landing Page Sektionen
│   ├── dashboard/                      # Dashboard-Komponenten
│   └── shared/                         # Übergreifend (Nav, Footer…)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser-Client
│   │   ├── server.ts                   # Server-Client (Server Components)
│   │   └── middleware.ts
│   ├── stripe/
│   │   ├── client.ts
│   │   └── webhooks.ts
│   ├── claude/
│   │   ├── expose.ts                   # Exposé-Generator Prompt + API Call
│   │   ├── chatbot.ts                  # Chatbot System-Prompt + Handler
│   │   └── preisrechner.ts             # Preisrechner Prompt + API Call
│   ├── replicate/
│   │   └── bildverbesserung.ts
│   └── resend/
│       └── emails.ts
├── app/api/
│   ├── stripe/webhook/route.ts         # Stripe Webhook Handler
│   ├── claude/expose/route.ts          # Exposé generieren
│   ├── claude/chat/route.ts            # Chatbot
│   ├── claude/preisrechner/route.ts    # Preisrechner
│   └── replicate/bilder/route.ts       # Bildverbesserung
├── types/
│   └── index.ts                        # Alle TypeScript-Types
├── CLAUDE.md                           # ← dieses Dokument
├── DESIGN.md                           # Design-System (lies es immer)
└── PRD.md                              # Feature-Anforderungen (lies es immer)
```

---

## 4. Datenbank-Schema (Supabase / Postgres)

**Lies dieses Schema genau. Weiche nicht ohne Grund davon ab.**

```sql
-- Nutzer (wird von Supabase Auth automatisch befüllt)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  paket_tier TEXT CHECK (paket_tier IN ('starter', 'pro', 'premium')) DEFAULT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  paket_start TIMESTAMPTZ,
  paket_end TIMESTAMPTZ,  -- paket_start + 6 Monate
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Immobilien-Inserate
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE,                         -- z.B. "einfamilienhaus-albstadt-72458"
  status TEXT CHECK (status IN ('draft', 'aktiv', 'verkauft', 'abgelaufen')) DEFAULT 'draft',
  -- Objektdaten
  objekttyp TEXT CHECK (objekttyp IN ('haus', 'wohnung', 'grundstueck')),
  titel TEXT,
  beschreibung TEXT,
  strasse TEXT,
  plz TEXT,
  ort TEXT,
  wohnflaeche_qm NUMERIC,
  zimmer NUMERIC,
  baujahr INT,
  etage INT,
  zustand TEXT CHECK (zustand IN ('rohbau', 'renovierungsbeduerftig', 'gepflegt', 'modernisiert', 'neuwertig')),
  ausstattung JSONB DEFAULT '[]',            -- Array von Strings
  kaufpreis NUMERIC,
  energieausweis_klasse TEXT,
  heizungsart TEXT,
  -- Medien
  fotos JSONB DEFAULT '[]',                  -- Array von Supabase Storage URLs
  grundriss_url TEXT,
  -- KI-generierte Inhalte
  expose_html TEXT,                          -- Generierter Exposé-Inhalt
  expose_generiert_at TIMESTAMPTZ,
  preisspanne_von NUMERIC,
  preisspanne_bis NUMERIC,
  preisspanne_generiert_at TIMESTAMPTZ,
  -- Portal-Status
  immoscout_url TEXT,
  kleinanzeigen_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interessenten (über Kontaktformular)
CREATE TABLE interessenten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  telefon TEXT,
  nachricht TEXT,
  status TEXT CHECK (status IN ('neu', 'kontaktiert', 'besichtigung_geplant', 'abgesagt', 'kaufinteressent')) DEFAULT 'neu',
  notizen TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Besichtigungstermine
CREATE TABLE termine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  interessent_id UUID REFERENCES interessenten(id) ON DELETE SET NULL,
  datum DATE NOT NULL,
  uhrzeit TIME NOT NULL,
  dauer_min INT DEFAULT 30,
  notiz TEXT,
  status TEXT CHECK (status IN ('geplant', 'bestaetigt', 'abgesagt', 'durchgefuehrt')) DEFAULT 'geplant',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklisten-Fortschritt
CREATE TABLE checkliste_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  aufgabe_id TEXT NOT NULL,               -- z.B. "vorbereitung_energieausweis"
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, aufgabe_id)
);

-- Foto-Analysen (KI-generiert, gecached)
CREATE TABLE foto_analysen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  foto_url TEXT NOT NULL,
  analyse_text TEXT,                      -- Claude Vision Ergebnis
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waitlist (Landing Page)
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  vorname TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Row Level Security (RLS) — Pflicht für jede Tabelle:**
```sql
-- Beispiel für listings:
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nutzer sieht nur eigene Listings" ON listings
  FOR ALL USING (auth.uid() = user_id);
-- Öffentliche Inserate lesbar:
CREATE POLICY "Aktive Listings öffentlich lesbar" ON listings
  FOR SELECT USING (status = 'aktiv');
```
RLS für jede Tabelle analog einrichten. **Kein Supabase-Call ohne RLS.**

---

## 5. Feature-Flags & Paket-Logik

**Paket-Tier wird aus `users.paket_tier` gelesen. Nie hardcoden.**

```typescript
// lib/features.ts
export const FEATURES = {
  listing:         ['starter', 'pro', 'premium'],
  checkliste:      ['starter', 'pro', 'premium'],
  chatbot:         ['starter', 'pro', 'premium'],
  expose:          ['pro', 'premium'],
  preisrechner:    ['pro', 'premium'],
  crm:             ['pro', 'premium'],
  termine:         ['pro', 'premium'],
  portal_listing:  ['premium'],
  bildverbesserung:['premium'],
  makler_support:  ['premium'],
} as const;

export function hasFeature(tier: string | null, feature: keyof typeof FEATURES): boolean {
  if (!tier) return false;
  return (FEATURES[feature] as readonly string[]).includes(tier);
}
```

**Gesperrte Features = Blur-Preview mit Upgrade-CTA, NICHT 404 oder leere Seite.**

```tsx
// components/ui/FeatureGate.tsx
export function FeatureGate({ feature, tier, children }: FeatureGateProps) {
  if (hasFeature(tier, feature)) return <>{children}</>;
  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <UpgradeCTA feature={feature} currentTier={tier} />
      </div>
    </div>
  );
}
```

---

## 6. Claude API — Patterns & Prompts

**Model immer:** `claude-sonnet-4-20250514`
**Max tokens:** 4096 für Exposé, 1024 für Chatbot/Preisrechner
**Timeout:** 30 Sekunden — dann Fehlermeldung, nie endlos warten lassen

### 6.1 Exposé-Generator

**Zwei-Stufen-Architektur:**

**Stufe 1 — Foto-Analyse (im Hintergrund beim Upload):**
```typescript
// lib/claude/expose.ts
export async function analysiereFoto(imageBase64: string, mediaType: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
        { type: 'text', text: `Analysiere dieses Immobilienfoto für ein professionelles Exposé.
Beschreibe präzise: Raum/Bereich, erkennbare Ausstattungsmerkmale, Lichtsituation, Zustand.
Was fällt positiv auf? Antworte in 2–3 Sätzen auf Deutsch. Nur Fakten, keine Wertung.` }
      ]
    }]
  });
  return response.content[0].type === 'text' ? response.content[0].text : '';
}
```

**Stufe 2 — Exposé-Generierung:**
```typescript
export async function generiereExpose(input: ExposeInput): Promise<ExposeOutput> {
  const systemPrompt = `Du bist ein erfahrener deutscher Immobilienmakler mit 20 Jahren Erfahrung.
Du schreibst Exposés die:
- Emotionen wecken ohne zu übertreiben oder zu lügen
- Fakten elegant in Fließtext einweben, nicht als Liste aufzählen
- Die ideale Käuferperson direkt und konkret ansprechen
- Nie generisch klingen — jedes Exposé ist einzigartig
- Keine leeren Buzzwords: nie "traumhaft", "einmalig", "hochwertig" ohne Beleg
- Immer auf Deutsch, professionell und warmherzig

Du antwortest AUSSCHLIESSLICH mit einem JSON-Objekt. Kein Kommentar davor oder danach.`;

  const userPrompt = `Erstelle ein professionelles Immobilien-Exposé aus diesen Daten:

OBJEKT-DATEN:
${JSON.stringify(input.listing, null, 2)}

FOTO-ANALYSEN (Claude Vision):
${input.fotoAnalysen.map((f, i) => `Foto ${i+1}: ${f}`).join('\n')}

LAGE-KONTEXT (recherchiert):
${input.lageKontext}

VERKÄUFER-FREITEXT:
Was ist besonders: "${input.wasIstBesonders}"
Ideale Käufer: "${input.idealeKaeufer}"

Antworte mit exakt diesem JSON:
{
  "titel": "Prägnanter Titel mit Ort und USP (max. 80 Zeichen)",
  "tagline": "Ein Satz der die Zielgruppe direkt anspricht (max. 120 Zeichen)",
  "beschreibung_kurz": "3 Sätze für Portal-Preview — zieht sofort an",
  "beschreibung_lang": "4–6 Absätze Fließtext — Objekt, Ausstattung, Lage, Atmosphäre. Jeder Absatz ein Thema.",
  "ausstattung_text": "Ausstattungs-Highlights in 2–3 Sätzen Fließtext formuliert",
  "lage_text": "Lage und Infrastruktur in 2–3 Sätzen, basierend auf den Lage-Daten",
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"]
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  return JSON.parse(text) as ExposeOutput;
}
```

### 6.2 KI-Chatbot

```typescript
// lib/claude/chatbot.ts
export const CHATBOT_SYSTEM_PROMPT = `Du bist ein hilfreicher Verkaufs-Assistent auf du-bist-der-makler.de.
Du hilfst privaten Immobilienverkäufern in Deutschland beim Verkaufsprozess.

Du kannst helfen bei: Ablauf des Verkaufs, Energieausweis-Pflicht, Notarkosten,
Besichtigungstipps, Preisverhandlung, Exposé erstellen, Inserat-Texte,
Unterlagen die man braucht, typische Käufer-Fragen.

Du darfst NICHT: Rechtliche Beratung geben, Steuerberatung geben,
konkrete Preise garantieren, Anwälte oder Makler empfehlen.

Bei Rechtsfragen antworte immer: "Für rechtliche Fragen empfehle ich einen Notar 
oder Rechtsanwalt. Das übersteigt meinen Beratungsbereich als KI-Assistent."

Ton: Freundlich, kompetent, klar. Kurze Antworten bevorzugen.
Sprache: Immer Deutsch.`;
```

### 6.3 KI-Preisrechner

```typescript
// lib/claude/preisrechner.ts
export async function schaetzePreis(input: PreisrechnerInput): Promise<PreisrechnerOutput> {
  const systemPrompt = `Du bist ein Immobilienbewertungs-Assistent für den deutschen Markt.
Du gibst realistische Preisspannen basierend auf Markt-Vergleichswerten.
Du bist immer konservativ und ehrlich. Du übertreibst nicht nach oben.
Du antwortest AUSSCHLIESSLICH mit JSON.`;

  const userPrompt = `Schätze den Marktwert dieser Immobilie:
PLZ: ${input.plz}, Ort: ${input.ort}
Typ: ${input.objekttyp}, Fläche: ${input.wohnflaeche_qm}m²
Zimmer: ${input.zimmer}, Baujahr: ${input.baujahr}
Zustand: ${input.zustand} (Skala: rohbau/renovierungsbeduerftig/gepflegt/modernisiert/neuwertig)
Energieklasse: ${input.energieausweis_klasse ?? 'unbekannt'}

Antworte mit:
{
  "preis_von": 123000,
  "preis_bis": 145000,
  "preis_median": 134000,
  "preis_pro_qm_von": 1025,
  "preis_pro_qm_bis": 1208,
  "faktoren_positiv": ["Faktor 1", "Faktor 2"],
  "faktoren_negativ": ["Faktor 1"],
  "marktlage": "Kurze Einschätzung der Marktlage in dieser Region (2 Sätze)",
  "disclaimer": "Diese Schätzung ist eine KI-Orientierung und ersetzt keine professionelle Wertermittlung."
}`;

  // ... API Call analog zu oben
}
```

---

## 7. Stripe — Webhook & Paket-Aktivierung

```typescript
// app/api/stripe/webhook/route.ts
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  
  // Signatur IMMER validieren — kein Ausnahmen
  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const tier = session.metadata?.paket_tier as 'starter' | 'pro' | 'premium';
    const userId = session.metadata?.user_id;
    
    await supabase.from('users').update({
      paket_tier: tier,
      stripe_customer_id: session.customer as string,
      stripe_payment_intent_id: session.payment_intent as string,
      paket_start: new Date().toISOString(),
      paket_end: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq('id', userId);
    
    // Willkommens-E-Mail via Resend
    await sendWillkommensEmail(session.customer_details?.email!, tier);
  }

  return Response.json({ received: true });
}
```

**Stripe Produkt-IDs (Umgebungsvariablen):**
```
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_PREMIUM=price_...
STRIPE_PRICE_MAKLERSTUNDE=price_...
```

---

## 8. Design-Regeln (Kurzfassung — DESIGN.md ist die Quelle)

> **Pflicht:** Lies `DESIGN.md` bevor du UI-Komponenten schreibst.

**Die wichtigsten Regeln im Überblick:**

```
Akzentfarbe:     #1B6B45  (Hover: #145538, Light: #E8F5EE)
Font:            Inter — nur Gewichte 500, 600, 700
Headlines:       letter-spacing: -0.02em bis -0.04em
Background:      Immer #FFFFFF — kein Off-White, kein Grau
Spacing-System:  4px Basis — alle Abstände Vielfache von 4
Border-Radius:   8px Standard, 12px Cards, 999px Pills/Buttons
Shadows:         Nur subtil: box-shadow: 0 1px 3px rgba(0,0,0,0.08)
```

**Tailwind-Klassen für den Accent:**
```tsx
// Primärer Button
<button className="bg-[#1B6B45] hover:bg-[#145538] text-white font-semibold 
                   px-6 py-3 rounded-full transition-colors duration-200">

// Feature-Badge (gesperrt)
<span className="bg-[#E8F5EE] text-[#1B6B45] text-sm font-medium px-3 py-1 rounded-full">

// Link / Text-Akzent
<span className="text-[#1B6B45] font-semibold">
```

**Philosophie:** Weißes Canvas, ein Akzent, großzügiges Spacing, warmherzige Autorität.
Kein kaltes Tech-Feeling. Kein Dark Mode. Keine bunten Farbverläufe.

---

## 9. Komponenten-Konventionen

### Server vs. Client Components
```typescript
// Server Component (default — bevorzugen):
// - Datenbankzugriffe
// - Keine Interaktivität
// - SEO-relevante Inhalte

// Client Component ('use client' nur wenn nötig):
// - useState, useEffect
// - Event Handler
// - Browser APIs
// - Claude API Calls (Streaming)
```

### Naming
```
PascalCase:   Komponenten (ListingCard, FeatureGate, ExposeGenerator)
camelCase:    Funktionen, Variablen, Hooks
kebab-case:   Dateinamen, CSS-Klassen, URL-Slugs
SCREAMING:    Konstanten, Env-Variablen
```

### Fehlerbehandlung
```typescript
// Immer try/catch bei API-Calls
// Immer Ladeindikator bei KI-Calls (kann 10–20s dauern)
// Immer verständliche Fehlermeldungen auf Deutsch
// Niemals rohe Error-Objects dem User zeigen

// Muster:
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

try {
  setLoading(true);
  setError(null);
  const result = await apiCall();
  // ...
} catch (e) {
  setError('Etwas hat nicht geklappt. Bitte versuche es erneut.');
} finally {
  setLoading(false);
}
```

### TypeScript — Wichtigste Types
```typescript
// types/index.ts

export type PaketTier = 'starter' | 'pro' | 'premium';

export type ListingStatus = 'draft' | 'aktiv' | 'verkauft' | 'abgelaufen';

export type Objekttyp = 'haus' | 'wohnung' | 'grundstueck';

export type Zustand = 
  | 'rohbau' 
  | 'renovierungsbeduerftig' 
  | 'gepflegt' 
  | 'modernisiert' 
  | 'neuwertig';

export interface Listing {
  id: string;
  user_id: string;
  slug: string;
  status: ListingStatus;
  objekttyp: Objekttyp;
  titel: string | null;
  beschreibung: string | null;
  strasse: string;
  plz: string;
  ort: string;
  wohnflaeche_qm: number;
  zimmer: number;
  baujahr: number;
  zustand: Zustand;
  ausstattung: string[];
  kaufpreis: number;
  energieausweis_klasse: string | null;
  fotos: string[];
  grundriss_url: string | null;
  expose_html: string | null;
  created_at: string;
  updated_at: string;
}

export interface Interessent {
  id: string;
  listing_id: string;
  name: string;
  email: string;
  telefon: string | null;
  nachricht: string | null;
  status: 'neu' | 'kontaktiert' | 'besichtigung_geplant' | 'abgesagt' | 'kaufinteressent';
  notizen: string | null;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  paket_tier: PaketTier | null;
  stripe_customer_id: string | null;
  paket_start: string | null;
  paket_end: string | null;
  created_at: string;
}

export interface ExposeInput {
  listing: Listing;
  fotoAnalysen: string[];
  lageKontext: string;
  wasIstBesonders: string;
  idealeKaeufer: string;
}

export interface ExposeOutput {
  titel: string;
  tagline: string;
  beschreibung_kurz: string;
  beschreibung_lang: string;
  ausstattung_text: string;
  lage_text: string;
  highlights: string[];
}
```

---

## 10. Umgebungsvariablen

```bash
# .env.local — NIEMALS committen

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # Nur Server-seitig

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_PRO=
STRIPE_PRICE_PREMIUM=
STRIPE_PRICE_MAKLERSTUNDE=

# Claude API
ANTHROPIC_API_KEY=

# Replicate
REPLICATE_API_TOKEN=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@du-bist-der-makler.de

# App
NEXT_PUBLIC_APP_URL=https://du-bist-der-makler.de
```

---

## 11. Qualitäts-Checkliste (vor jedem Commit)

**Performance:**
- [ ] Lighthouse Score ≥ 85
- [ ] LCP < 2.5s auf Landing Page
- [ ] Bilder mit `next/image` optimiert
- [ ] Keine unnötigen Client Components

**Sicherheit:**
- [ ] RLS für alle neuen Supabase-Tabellen eingerichtet
- [ ] Stripe Webhook-Signatur validiert
- [ ] API Routes prüfen ob User eingeloggt ist (`auth.getUser()`)
- [ ] Keine Secrets im Client-Bundle (prefix `NEXT_PUBLIC_` nur für öffentliche Werte)

**UX:**
- [ ] Ladeindikator bei allen API-Calls > 500ms
- [ ] Fehlermeldungen auf Deutsch, verständlich
- [ ] Mobile-optimiert (320px bis 1440px)
- [ ] Gesperrte Features zeigen Blur-Preview + Upgrade-CTA

**KI:**
- [ ] Disclaimer bei Preisrechner sichtbar
- [ ] Disclaimer bei Chatbot sichtbar
- [ ] KI-Calls mit Timeout (30s) + Fehlerbehandlung
- [ ] Kein Rechtsrat durch den Chatbot möglich

**Rechtliches (vor Live-Schaltung):**
- [ ] Impressum vollständig
- [ ] Datenschutzerklärung vorhanden
- [ ] AGB vorhanden
- [ ] Cookie-Banner (nur technische Cookies → kein Banner nötig)

---

## 12. Häufige Fehler — und wie man sie vermeidet

| Fehler | Richtig |
|--------|---------|
| `supabase.from('listings').select('*')` ohne Filter | Immer `.eq('user_id', user.id)` — RLS als Backup, nicht als einziger Schutz |
| Paket-Tier im Frontend hardcoden | Immer aus `users.paket_tier` lesen |
| Stripe Webhook ohne Signatur-Check | Pflicht: `stripe.webhooks.constructEvent()` |
| KI-Call ohne Ladeindikator | Immer `setLoading(true)` + Spinner |
| Englische UI-Texte | Die komplette UI ist auf Deutsch |
| `console.log` mit sensiblen Daten | Niemals User-Daten loggen |
| Feature-Seite für falsches Paket = 404 | Blur-Preview + Upgrade-CTA |
| Foto-Upload ohne Validierung | Nur JPEG/PNG/WEBP, max. 10MB, keine ausführbaren Dateien |

---

## 13. Wichtige Business-Regeln (nicht verändern)

1. **Preise sind fix:** 299€ / 499€ / 699€ / 50€ add-on — keine eigenmächtigen Änderungen
2. **Laufzeit ist immer 6 Monate** — kein Abo, keine automatische Verlängerung
3. **Wir sind kein Makler** — dieser Satz muss irgendwo auf jeder Seite klar sein
4. **KI gibt keinen Rechtsrat** — Disclaimer ist rechtlich notwendig, nicht optional
5. **ImmoScout-Listing ist manuell für MVP** — kein API-Call, Nico/Kollege machen es händisch
6. **Upgrade-Flow im MVP = E-Mail an Support** — kein Self-Service Upgrade im Dashboard
7. **1 Objekt pro Account im MVP** — kein Multi-Listing

---

*CLAUDE.md — du-bist-der-makler.de — April 2026*
*Nico + Kollege — Vertraulich*
