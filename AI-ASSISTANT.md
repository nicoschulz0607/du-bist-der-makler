# 🤖 AI-ASSISTANT.md

> Architektur- und Implementierungsplan für **Klara** — den KI-Assistenten von du-bist-der-makler.de
>
> Status: Spezifikation, bereit für Implementierung
> Letztes Update: Mai 2026
> Eigentümer: Nico

---

## 1. Konzept

### 1.1 Was Klara ist
Klara ist der eingebettete KI-Verkaufs-Assistent von du-bist-der-makler.de. Sie hilft Privatverkäufern beim gesamten Verkaufsprozess — von der ersten Frage zum Energieausweis bis zum Notartermin. Sie kennt das Objekt des Nutzers, seine Interessenten, seinen Paket-Status und alle Inhalte der Plattform.

### 1.2 Was Klara nicht ist
- **Keine Maklerin.** Sie verhandelt nicht, vertritt niemanden rechtlich, gibt keine bindenden Auskünfte.
- **Keine Anwältin.** Bei Rechtsfragen verweist sie auf Notar oder Anwalt.
- **Keine Steuerberaterin.** Bei Steuerfragen verweist sie auf den Steuerberater.
- **Kein autonomer Agent.** Sie führt im MVP keine Aktionen aus, die Daten verändern (außer Konversationen speichern).

### 1.3 Persona
- **Name:** Klara
- **Tonalität:** Warm, kompetent, geduldig. Duzt den Nutzer (passt zum Markenauftritt).
- **Avatar:** Kreis in Akzentfarbe `#1B6B45` mit Sparkle-Icon (`✨` von Lucide oder eigenes SVG)
- **Disclaimer im Header:** *„Klara ist eine KI. Kein Rechts-, Steuer- oder Anlageberatungs-Ersatz."*

---

## 2. Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ /dashboard/  │  │  Floating    │  │  Inline „Frag    │ │
│  │  klara       │  │  Bubble      │  │  Klara" Buttons  │ │
│  │  (Vollbild)  │  │  (slide-in)  │  │  (kontextuell)   │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘ │
│         └─────────────────┴───────────────────┘            │
│                           │                                 │
│                  shared <ChatInterface />                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ POST /api/klara/chat
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              API Route (Edge Runtime, streaming)            │
│  1. Auth-Check (Supabase JWT)                              │
│  2. Rate-Limit-Check (Soft, später konfigurierbar)         │
│  3. Konversation laden / erstellen                         │
│  4. User-Context aus Supabase ziehen                       │
│  5. System-Prompt zusammenbauen                            │
│  6. Claude API Call (streaming)                            │
│  7. Antwort streamen + speichern                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
   ┌────────────────┐          ┌──────────────────┐
   │  Supabase      │          │  Claude API      │
   │  - users       │          │  Sonnet (4.7)    │
   │  - listings    │          │  Streaming       │
   │  - interess.   │          │                  │
   │  - termine     │          │                  │
   │  - klara_      │          │                  │
   │    conversa-   │          │                  │
   │    tions       │          │                  │
   │  - klara_      │          │                  │
   │    messages    │          │                  │
   └────────────────┘          └──────────────────┘
```

---

## 3. Datenmodell (Supabase)

Zwei neue Tabellen plus eine optionale für gespeicherte Antworten.

### 3.1 `klara_conversations`
Eine Konversation = ein Thread. Auto-Titel wird nach 2-3 Messages generiert.

```sql
CREATE TABLE klara_conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT,                    -- auto-generiert nach 3 messages
  context_origin  TEXT,                    -- 'standalone' | 'interessenten' | 'exposé' | 'objekt' | 'checkliste' | ...
  pinned          BOOLEAN DEFAULT FALSE,   -- vom User „⭐ wichtig" markiert
  archived        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_klara_conv_user_recent ON klara_conversations (user_id, updated_at DESC)
  WHERE archived = FALSE;
```

**RLS-Policy:**
```sql
ALTER TABLE klara_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_conversations" ON klara_conversations
  FOR ALL USING (auth.uid() = user_id);
```

### 3.2 `klara_messages`
Eine Zeile = eine Message (User oder Assistant).

```sql
CREATE TABLE klara_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES klara_conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  saved           BOOLEAN DEFAULT FALSE,   -- User hat „⭐ Merken" geklickt
  tokens_in       INTEGER,                  -- für Kosten-Monitoring
  tokens_out      INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_klara_msg_conv ON klara_messages (conversation_id, created_at);
CREATE INDEX idx_klara_msg_saved ON klara_messages (conversation_id, saved) WHERE saved = TRUE;
```

**RLS-Policy:**
```sql
ALTER TABLE klara_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_messages" ON klara_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM klara_conversations WHERE user_id = auth.uid()
    )
  );
```

### 3.3 `klara_usage` (für Rate-Limiting + Monitoring)
Tagesstatistik pro User. Reset um Mitternacht via cron oder on-the-fly.

```sql
CREATE TABLE klara_usage (
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  message_count   INTEGER DEFAULT 0,
  tokens_total    INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, usage_date)
);

CREATE INDEX idx_klara_usage_date ON klara_usage (usage_date);
```

**RLS:** Nur Service-Role darf schreiben (über die API-Route), User darf eigene Zeile lesen.

---

## 4. System-Prompt-Architektur

Der System-Prompt wird **bei jeder Anfrage frisch** zusammengebaut. Drei Bausteine:

```
[BAUSTEIN 1: Identität & Regeln]   ← statisch, ~800 Tokens
[BAUSTEIN 2: Plattform-Knowledge]  ← statisch, ~3000 Tokens
[BAUSTEIN 3: User-Kontext]         ← dynamisch, ~500 Tokens
```

**Gesamt-Größe:** ~4300 Tokens pro Call (System-Prompt only).
Bei Claude Sonnet (~3 USD/Mio Input-Tokens) sind das ~0,013 USD = 1,3 Cent reine System-Prompt-Kosten pro Anfrage. Für 1000 Anfragen also 13 USD. Vernachlässigbar.

### 4.1 Baustein 1: Identität & Regeln

```
Du bist Klara, der KI-Verkaufsassistent der Plattform du-bist-der-makler.de.

DEINE ROLLE:
- Du hilfst Privatverkäufern beim Immobilienverkauf in Deutschland.
- Du beantwortest Fragen zu: Verkaufsprozess, Energieausweis, Notar,
  Besichtigungen, Preisverhandlung, Steuern (allgemein), Vermarktung.
- Du erklärst Funktionen der Plattform du-bist-der-makler.de.
- Du gibst dem Nutzer praktische, umsetzbare Tipps.

DEIN STIL:
- Du duzt den Nutzer.
- Du bist warm, kompetent, geduldig — nie belehrend.
- Du antwortest präzise und kommst auf den Punkt. Keine Floskeln.
- Du strukturierst längere Antworten mit kurzen Absätzen, kein Wall of Text.
- Du nutzt Listen NUR wenn echte Aufzählung sinnvoll ist.
- Bei Verkaufsdetails: konkrete Zahlen / Beispiele aus dem deutschen Markt.

WAS DU NICHT TUST:
- Keine Rechtsberatung. Bei rechtlichen Fragen: „Das ist ein Fall für einen
  Notar oder Fachanwalt — ich gebe nur allgemeine Informationen."
- Keine Steuerberatung. Bei Steuerfragen: Verweis auf Steuerberater.
- Keine bindenden Preisaussagen. Bei Preis-Fragen: „Das ist eine Schätzung,
  die endgültige Preisbildung erfolgt durch den Markt."
- Keine Aussagen zu Spekulationsfristen oder konkreten Steuerbeträgen
  ohne den Hinweis auf Beratung.
- Keine Garantien. Niemals „X führt zu Y" — immer „X kann zu Y führen".

WICHTIG:
- Wenn der Nutzer dich nach etwas fragt, was DU als Klara/die Plattform
  tun könntest, dann antworte konkret aus der PLATTFORM-KNOWLEDGE.
- Wenn der Nutzer Daten zu seinem Objekt / Interessenten / Terminen abfragt,
  nutze NUR den USER-KONTEXT unten. Keine Annahmen, kein Erfinden.
- Wenn der USER-KONTEXT die Frage nicht beantworten kann, sag das offen:
  „Das sehe ich gerade nicht in deinen Daten — kannst du es mir sagen?"
```

### 4.2 Baustein 2: Plattform-Knowledge (Static Markdown)
Kompakt zusammengefasst, was Klara über *uns* wissen muss. Wird als statische Markdown-Datei `lib/klara/knowledge.md` versioniert. Beinhaltet:

- **Pakete & Preise:** Starter 299€, Pro 499€, Premium 699€ (+ alle Features)
- **Laufzeit-Logik:** 6 Monate, kein Abo, keine automatische Verlängerung
- **Upgrade-Flow:** Aktuell per E-Mail an support@du-bist-der-makler.de
- **Add-ons:** Makler-Stunde 50€/h, Premium hat erste Stunde inklusive
- **Energieausweis:** Pflicht beim Verkauf, Partner-Link im Dashboard, ca. 79€
- **Was ist im jeweiligen Paket inklusive (Tabelle 1:1 wie im PRD)
- **FAQ:** Die 10 häufigsten Fragen mit Antworten, abgeleitet aus der Landing Page
- **Was Klara *nicht* kann:** Keine Aktionen ausführen (im MVP), keine Termine eintragen, keine E-Mails verschicken

Diese Datei wird im Code per `fs.readFileSync` geladen oder direkt als String importiert.

### 4.3 Baustein 3: User-Kontext (dynamisch)
Wird pro Anfrage aus Supabase gezogen. Beispiel-Output:

```
USER-KONTEXT (Stand: 2026-05-04 14:32):

Nutzer: Nico Müller
Paket: Premium
Paket aktiv bis: 2026-09-04 (noch 4 Monate, 0 Tage)

Objekt:
- Typ: Einfamilienhaus
- Adresse: 72458 Albstadt, Musterweg 12
- Wohnfläche: 145 m²
- Zimmer: 5
- Baujahr: 1998
- Preis: 489.000 €
- Energieausweisklasse: C
- Status: aktiv seit 12 Tagen
- Anzahl Fotos: 18

Interessenten (insgesamt 7):
- 3 mit Status „Neu" (älteste Anfrage 2 Tage alt)
- 2 mit Status „Kontaktiert"
- 2 mit Status „Besichtigung geplant"
- 0 mit Status „Abgesagt"
- 0 Kaufinteressenten

Nächste Termine:
- 2026-05-06, 18:00, Familie Schmidt (Erstbesichtigung, 30 Min)
- 2026-05-08, 17:00, Herr Becker (Erstbesichtigung, 30 Min)

Checkliste-Fortschritt: 8 von 24 Aufgaben erledigt (33%).
Letzte erledigte Aufgabe: „Energieausweis bestellen"
Nächste offene Aufgabe: „Hochwertige Fotos erstellen lassen"

Kontext-Origin (woher die Frage kommt): „interessenten"
```

**Wichtig:** Den Kontext-Block nur einbauen, wenn der User eingeloggt ist und Daten existieren. Für anonyme Anfragen auf der Landing-Page (falls Klara dort später auftaucht) nur Baustein 1 + 2.

### 4.4 Vollständiger Pseudocode für Prompt-Building

```typescript
// lib/klara/build-system-prompt.ts

import { readFileSync } from 'fs';
import { join } from 'path';

const IDENTITY = readFileSync(
  join(process.cwd(), 'lib/klara/identity.md'),
  'utf-8'
);
const KNOWLEDGE = readFileSync(
  join(process.cwd(), 'lib/klara/knowledge.md'),
  'utf-8'
);

export async function buildSystemPrompt(
  userId: string,
  contextOrigin: string,
  supabase: SupabaseClient
): Promise<string> {
  const userContext = await fetchUserContext(userId, supabase);

  return `${IDENTITY}

---

# PLATTFORM-KNOWLEDGE

${KNOWLEDGE}

---

# USER-KONTEXT (Stand: ${new Date().toISOString()})

${formatUserContext(userContext, contextOrigin)}
`;
}
```

---

## 5. API-Route: `/app/api/klara/chat/route.ts`

Edge Runtime für Streaming. Standard-Pattern für Claude Streaming auf Next.js.

```typescript
// app/api/klara/chat/route.ts

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { buildSystemPrompt } from '@/lib/klara/build-system-prompt';
import { checkRateLimit, recordUsage } from '@/lib/klara/rate-limit';
import { generateTitleIfNeeded } from '@/lib/klara/title-generator';

export const runtime = 'edge';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: Request) {
  const supabase = createClient();

  // 1) Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  // 2) Rate-Limit
  const rateCheck = await checkRateLimit(user.id, supabase);
  if (!rateCheck.allowed) {
    return Response.json({
      error: 'rate_limit',
      remaining: 0,
      message: rateCheck.message
    }, { status: 429 });
  }

  // 3) Body parsen
  const { conversationId, message, contextOrigin } = await req.json();

  // 4) Konversation laden oder erstellen
  let convId = conversationId;
  if (!convId) {
    const { data } = await supabase
      .from('klara_conversations')
      .insert({ user_id: user.id, context_origin: contextOrigin })
      .select('id')
      .single();
    convId = data!.id;
  }

  // 5) User-Message speichern
  await supabase.from('klara_messages').insert({
    conversation_id: convId,
    role: 'user',
    content: message
  });

  // 6) Bisherige Messages laden (max. letzte 20 für Context-Window)
  const { data: history } = await supabase
    .from('klara_messages')
    .select('role, content')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
    .limit(20);

  // 7) System-Prompt bauen
  const systemPrompt = await buildSystemPrompt(user.id, contextOrigin, supabase);

  // 8) Claude API Call (streaming)
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: systemPrompt,
    messages: history!.map(m => ({ role: m.role, content: m.content }))
  });

  // 9) Antwort als SSE streamen + parallel sammeln zum Speichern
  let fullResponse = '';
  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta'
              && event.delta.type === 'text_delta') {
            const chunk = event.delta.text;
            fullResponse += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
          }
        }

        // Final-Event: conversationId mitschicken (für Frontend)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversationId: convId })}\n\n`));
        controller.close();

        // Asynchron speichern (nicht awaited, damit Stream schnell schließt)
        const finalMessage = await stream.finalMessage();
        await supabase.from('klara_messages').insert({
          conversation_id: convId,
          role: 'assistant',
          content: fullResponse,
          tokens_in: finalMessage.usage.input_tokens,
          tokens_out: finalMessage.usage.output_tokens
        });

        await recordUsage(user.id, finalMessage.usage, supabase);
        await generateTitleIfNeeded(convId, supabase, anthropic);
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'stream_failed' })}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

### 5.1 Rate-Limiting-Logik (Soft + Optional)

```typescript
// lib/klara/rate-limit.ts

const LIMITS = {
  starter: 30,    // pro Tag
  pro:     100,
  premium: 500    // praktisch unlimited
};

export async function checkRateLimit(userId: string, supabase: SupabaseClient) {
  // Paket des Users laden
  const { data: user } = await supabase
    .from('users')
    .select('paket_tier')
    .eq('id', userId)
    .single();

  const limit = LIMITS[user!.paket_tier ?? 'starter'];

  // Heutige Nutzung
  const { data: usage } = await supabase
    .from('klara_usage')
    .select('message_count')
    .eq('user_id', userId)
    .eq('usage_date', new Date().toISOString().split('T')[0])
    .maybeSingle();

  const used = usage?.message_count ?? 0;

  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    limit,
    message: used >= limit
      ? `Du hast dein Tageslimit (${limit} Fragen) erreicht. Morgen geht's weiter — oder upgrade auf Premium für deutlich mehr.`
      : null
  };
}
```

**MVP-Empfehlung:** Limits großzügig setzen (Starter 30/Tag) — das fühlt sich wie unlimited an. Wenn ein User 30 echte Fragen am Tag stellt, ist das eh ein Premium-Kandidat. Counter im UI nur anzeigen, wenn `remaining < 5`.

### 5.2 Auto-Titel-Generierung

```typescript
// lib/klara/title-generator.ts

export async function generateTitleIfNeeded(
  convId: string,
  supabase: SupabaseClient,
  anthropic: Anthropic
) {
  const { data: conv } = await supabase
    .from('klara_conversations')
    .select('title')
    .eq('id', convId)
    .single();

  if (conv?.title) return; // schon vorhanden

  const { data: msgs } = await supabase
    .from('klara_messages')
    .select('role, content')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
    .limit(4);

  if (!msgs || msgs.length < 2) return; // zu früh

  const result = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 30,
    messages: [{
      role: 'user',
      content: `Fasse den Inhalt dieser Konversation in maximal 5 Wörtern auf Deutsch zusammen. Nur den Titel, keine Anführungszeichen, kein Punkt am Ende.\n\n${msgs.map(m => `${m.role}: ${m.content}`).join('\n\n')}`
    }]
  });

  const title = (result.content[0] as { text: string }).text.trim();
  await supabase.from('klara_conversations').update({ title }).eq('id', convId);
}
```

Haiku statt Sonnet, weil's nur einen Mini-Titel braucht — kostet praktisch nichts.

---

## 6. Frontend-Komponenten

Drei UI-Modi, die alle dieselbe `<ChatInterface />` teilen.

### 6.1 Komponenten-Struktur

```
components/klara/
  ├── ChatInterface.tsx       ← Kern-Chat-UI (wiederverwendbar)
  ├── ChatMessage.tsx         ← Einzelne Message (User oder Klara)
  ├── ChatInput.tsx           ← Input + Send-Button + Suggestions
  ├── KlaraAvatar.tsx         ← Sparkle-Icon im grünen Kreis
  ├── ConversationList.tsx    ← Verlaufs-Sidebar
  ├── FloatingBubble.tsx      ← Globaler Floating-Button
  ├── InlineButton.tsx        ← „Frag Klara" Inline-Button
  └── SaveAnswerButton.tsx    ← „⭐ Merken" pro Antwort
```

### 6.2 Modus 1: Vollbild-Seite `/dashboard/klara`

Layout: Zwei-Spalten.
- **Links (25%):** ConversationList — Liste vergangener Konversationen mit Auto-Titel + „Neue Konversation"-Button oben.
- **Rechts (75%):** ChatInterface mit der aktuellen Konversation. Empty-State zeigt 4 Beispielfragen aus dem PRD (Energieausweis, Notar, Unterlagen, Dauer).

### 6.3 Modus 2: Floating Bubble

Auf jeder Dashboard-Seite. Standard rechts unten:
- Zugeklappt: kreisrunder Button, 56×56px, Akzentfarbe `#1B6B45`, Sparkle-Icon, leichter Schatten.
- Ausgeklappt: Slide-In von rechts, 420px Breite (mobile: 100% Breite, von unten), Header „Klara hilft", Schließen-X.
- **Wichtig:** State persistiert pro Browser-Tab (localStorage), Konversation bleibt offen wenn User die Seite wechselt.
- Kontext: aktuelle Route wird als `contextOrigin` mitgeschickt.

### 6.4 Modus 3: Inline-Buttons

Strategische Stellen, wo Klara echten Mehrwert bietet:
- Im Interessenten-CRM, neben jedem Interessenten: *„Antwort an [Name] vorschlagen"*
- Im Exposé-Generator: *„Klara um Stilverbesserung bitten"*
- In jedem Checklisten-Item: *„Frag Klara dazu"*
- Im Preisrechner-Output: *„Verhandlungstaktik fragen"*

Jeder Button öffnet die Floating Bubble *vorausgefüllt mit einer kontextspezifischen Frage* — der User kann sie editieren oder direkt absenden.

### 6.5 Streaming-Frontend (vereinfacht)

```typescript
// hooks/useKlaraChat.ts

export function useKlaraChat(initialConvId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [convId, setConvId] = useState(initialConvId);

  async function send(text: string, contextOrigin: string) {
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setStreaming(true);

    const response = await fetch('/api/klara/chat', {
      method: 'POST',
      body: JSON.stringify({ conversationId: convId, message: text, contextOrigin })
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let assistantText = '';
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      // SSE parsen ("data: {...}")
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const event = JSON.parse(line.slice(6));
        if (event.chunk) {
          assistantText += event.chunk;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...last, content: assistantText }];
          });
        }
        if (event.conversationId && !convId) setConvId(event.conversationId);
      }
    }

    setStreaming(false);
  }

  return { messages, streaming, send, convId };
}
```

### 6.6 Empty-State (neue Konversation)

Vier Quick-Fragen als Suggestion-Chips:
- *„Welche Unterlagen brauche ich für den Verkauf?"*
- *„Was kostet ein Notar beim Immobilienverkauf?"*
- *„Muss ich einen Energieausweis haben?"*
- *„Wie lange dauert ein Immobilienverkauf?"*

Plus dynamisch eine fünfte, die zum Kontext passt — z.B. wenn `contextOrigin === 'interessenten'`: *„Wie schreibe ich Interessenten am besten an?"*.

### 6.7 „Merken"-Funktion

Hover über eine Klara-Message zeigt drei Icons rechts oben:
- 📋 Kopieren
- ⭐ Merken (toggelt `saved` in `klara_messages`)
- 👎 Schlecht (öffnet kurzes Feedback-Modal — optional für Phase 2)

Gespeicherte Antworten erscheinen unter `/dashboard/klara/gemerkt` als eigene Liste.

---

## 7. Sicherheit & Prompt-Hardening

### 7.1 Prompt-Injection-Schutz
Der User-Input wird **niemals** direkt in den System-Prompt eingebaut. Alles, was der User schreibt, kommt ausschließlich als `messages[].content` mit `role: "user"` ins Modell. Damit kann der User den System-Prompt nicht überschreiben — Anthropic behandelt System- und User-Tokens grundsätzlich getrennt.

### 7.2 Datenschutz im Kontext
- Im User-Kontext **nie** persönliche Daten von *Interessenten* einbauen (kein Name, keine E-Mail, kein Telefon). Nur aggregierte Zahlen + Status. Begründung: Klara muss den Interessenten nicht kennen, um zu helfen — und es minimiert die Daten, die ans Modell gehen.
- Adressdaten des Eigentümers nur, wenn der User explizit nach Lage-Bewertung fragt. Im Standard-Kontext nur PLZ + Stadt.

### 7.3 RLS auf allen Tabellen
Wie oben definiert. Jede Query geht über den User-JWT-Client, niemals über den Service-Role-Key (außer für `klara_usage`-Writes, die in Edge-Function laufen).

### 7.4 Disclaimer-Pflicht
- Im Chat-Header sichtbar: *„Klara ist eine KI. Kein Rechts-, Steuer- oder Anlageberatungs-Ersatz."*
- Bei jeder ersten Klara-Message in einer neuen Konversation als kleiner Hinweis-Block unter der Nachricht.
- In der Datenschutzerklärung: Hinweis, dass Konversationen verarbeitet und gespeichert werden, Verweis auf Anthropic als Sub-Auftragsverarbeiter.

### 7.5 EU AI Act
- Pflicht-Hinweis „Du sprichst mit einer KI" ist über Persona + Disclaimer abgedeckt.
- Logging der Konversationen ist in `klara_messages` ohnehin erfüllt.

---

## 8. Kosten-Modell (realistisch)

Annahmen:
- Sonnet 4.6 Input: ~3 USD / Mio Tokens, Output: ~15 USD / Mio Tokens (Stand Mai 2026, bitte vor Launch verifizieren)
- Durchschnittliche Anfrage: ~5000 Tokens Input, ~400 Tokens Output

**Pro Anfrage:**
- Input: 5000 × 3 / 1.000.000 = 0,015 USD
- Output: 400 × 15 / 1.000.000 = 0,006 USD
- **Gesamt: ~0,021 USD = 2 Cent**

**Pro User pro Monat (worst case Premium, 10 Fragen/Tag, 30 Tage):**
- 300 Anfragen × 2 Cent = 6 USD = ~5,50 EUR

**Bei 699 EUR Premium-Paket über 6 Monate:**
- KI-Kosten max. ~33 EUR über 6 Monate = ~4,7% des Paketpreises.

→ Tragbar, auch ohne Caching. Mit **Prompt Caching** auf Bausteine 1 + 2 (Anthropic Feature) sinken die Input-Kosten um ~75% nach dem ersten Call. Empfehlung: Prompt Caching ab Beta aktivieren.

---

## 9. Implementierungs-Roadmap

### Phase A: MVP-Klara (1-2 Wochen)
- [ ] Supabase-Tabellen anlegen + RLS
- [ ] Static Markdown `identity.md` + `knowledge.md` schreiben
- [ ] API-Route `/api/klara/chat` mit Streaming
- [ ] `<ChatInterface />` Komponente + `useKlaraChat`-Hook
- [ ] Vollbild-Seite `/dashboard/klara`
- [ ] Floating Bubble auf allen Dashboard-Seiten
- [ ] Auto-Titel-Generierung
- [ ] Disclaimer + EU AI Act-Compliance
- [ ] Rate-Limit (Soft, mit Default-Werten)

### Phase B: Kontext-Integration (1 Woche)
- [ ] User-Context-Builder mit allen 5 Datenquellen (User, Listing, Interessenten, Termine, Checkliste)
- [ ] Prompt-Caching aktivieren
- [ ] Inline-Buttons in CRM, Exposé, Checkliste, Preisrechner
- [ ] Vorausgefüllte Fragen bei Inline-Trigger

### Phase C: UX-Polish (1 Woche)
- [ ] „Merken"-Funktion + `/gemerkt`-Seite
- [ ] Konversations-Verlauf mit Suche
- [ ] Suggestion-Chips kontextspezifisch
- [ ] Mobile-Optimierung der Floating Bubble
- [ ] Counter „X Fragen heute frei" (nur sichtbar bei `remaining < 5`)

### Phase D: Beta-Iteration (laufend)
- [ ] Feedback-Button (👎) + Modal
- [ ] Knowledge-Base erweitern aus echten Beta-Konversationen
- [ ] System-Prompt-Tuning auf Basis von beobachteten Schwächen
- [ ] Optional: Tool-Use (Termin eintragen, Status ändern) — erst wenn Read-Only bewährt ist

---

## 10. Offene Entscheidungen

| Punkt | Optionen | Entscheidungs-Trigger |
|---|---|---|
| Prompt Caching aktivieren | Ja sofort / Erst ab Beta | Vor erstem zahlenden Premium-Kunden |
| Modell-Wahl Default | Sonnet 4.6 / Haiku 4.5 (billiger, kürzere Antworten) | A/B-Test in Beta |
| Conversation-Memory über mehrere Konversationen | Nein (jede Konversation isoliert) / Ja (Klara „erinnert" sich an alte Konversationen) | Phase D nach echtem User-Feedback |
| Voice-Input (Whisper) | Phase 2 / Nie | Nutzer-Wunsch in Beta abfragen |
| Klaras Antworten zu strukturieren erlauben | Markdown ja / nur Plaintext | UI-Test, Markdown ist optisch klarer |
| Globale Persona statt einzelner: nur „Klara" auf der Seite, oder zusätzlich „Mathilda" für Premium-Konzierge? | Eine Persona reicht im MVP | — |

---

## 11. Mini-Checkliste vor Launch

- [ ] DSGVO-Eintrag: Anthropic als Sub-Auftragsverarbeiter im AVV erfasst
- [ ] Datenschutzerklärung erweitert um Klara-Abschnitt
- [ ] Lösch-Button für einzelne Konversationen funktioniert
- [ ] Bei Account-Löschung werden Konversationen + Messages cascade-gelöscht
- [ ] Disclaimer überall sichtbar (Header, erste Message, Footer)
- [ ] System-Prompt enthält explizit: keine Rechts-/Steuerberatung
- [ ] Smoke-Test mit allen 3 Paket-Tiers (Starter, Pro, Premium)
- [ ] Smoke-Test mit User ohne Listing (Edge-Case: Kontext fast leer)
- [ ] Smoke-Test mit Stress-Frage („Wie kann ich Steuern hinterziehen?") → muss klar ablehnen
- [ ] Cost-Monitoring: Vercel Logging zeigt Tokens pro Request
