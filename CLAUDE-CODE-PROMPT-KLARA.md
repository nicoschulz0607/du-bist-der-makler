# Claude Code Prompt: Klara KI-Assistent implementieren

> Kopiere den gesamten Block unterhalb der Trennlinie in Claude Code.
> Vorausgesetzt: `AI-ASSISTANT.md`, `DESIGN.md` und `PRD.md` liegen im Repo-Root.

---

## ROLLE & KONTEXT

Du implementierst **Klara**, den KI-Verkaufsassistenten der Plattform du-bist-der-makler.de. Die vollständige technische Spezifikation liegt in `AI-ASSISTANT.md` im Repo-Root. Halte dich strikt daran. Für UI-Entscheidungen ist `DESIGN.md` maßgeblich, für Feature-Logik `PRD.md`.

**Tech-Stack ist fix:** Next.js (App Router), TypeScript, Tailwind, Supabase (Auth + Postgres + RLS), Anthropic SDK, Vercel Edge Runtime. Nicht abweichen, keine zusätzlichen Libraries vorschlagen, keine Alternativen "weil moderner" einbringen.

**Designsystem:** Inter-Font, Akzentfarbe `#1B6B45`, Hover `#145538`, Light `#E8F5EE`. Großzügiges Whitespace. Airbnb-inspiriertes Spacing. Keine Emoji-Avatare, keine bunten Gradients, kein "AI-Look".

---

## DEIN VORGEHEN — IN GENAU DIESER REIHENFOLGE

### Phase 0: Vorbereitung (bevor du Code schreibst)

1. Lies `AI-ASSISTANT.md` vollständig.
2. Lies `DESIGN.md` Abschnitt zu Buttons, Cards, Inputs, Spacing.
3. Lies `PRD.md` Abschnitt 4.3 (KI-Tools), insbesondere KI-03 Chatbot.
4. Schau dir die bestehende Repo-Struktur an: `app/`, `components/`, `lib/`, `supabase/`.
5. Prüfe ob diese Pakete schon installiert sind: `@anthropic-ai/sdk`, `@supabase/ssr`, `@supabase/supabase-js`, `lucide-react`. Falls nicht, installiere sie.
6. Stelle sicher, dass `ANTHROPIC_API_KEY` in `.env.local` existiert. Falls nicht, frage mich nach dem Wert oder erinnere mich daran, ihn zu setzen.

**Stop hier. Schreibe einen kurzen Bericht (max. 10 Zeilen): Was hast du gefunden, was fehlt, was deine Annahmen sind. Erst danach Phase 1.**

### Phase 1: Datenbank-Setup

Erstelle eine SQL-Migration unter `supabase/migrations/`:
- Tabellen: `klara_conversations`, `klara_messages`, `klara_usage` exakt wie in `AI-ASSISTANT.md` Abschnitt 3 spezifiziert
- Indizes wie spezifiziert
- RLS-Policies wie spezifiziert
- Cascade-Delete bei User-Löschung muss funktionieren

Migrationsdatei mit Zeitstempel benennen, z.B. `20260504120000_klara_tables.sql`.

Nach der Migration: kurzer Selbsttest mit `supabase db reset --linked` falls lokal verfügbar, sonst SQL-Code zur manuellen Ausführung bereitstellen.

### Phase 2: Lib-Layer

Erstelle in dieser Reihenfolge:

**2.1 `lib/klara/identity.md`** — der statische Identitäts-Block aus `AI-ASSISTANT.md` Abschnitt 4.1. Wortwörtlich übernehmen. Eine Markdown-Datei, kein TypeScript.

**2.2 `lib/klara/knowledge.md`** — Plattform-Wissensbasis. Inhalte:
- Pakete & Preise (Starter 299€, Pro 499€, Premium 699€) mit Feature-Tabelle aus PRD Abschnitt 2
- Laufzeit-Logik (6 Monate, kein Abo, keine Verlängerung)
- Upgrade-Prozess (per E-Mail an support@du-bist-der-makler.de)
- Add-ons (Makler-Stunde 50€/h, Premium hat 1h inklusive)
- Energieausweis (Pflicht, Partner-Link, ca. 79€)
- Was Klara nicht kann (keine Aktionen ausführen, keine Termine eintragen)
- 10 FAQ aus der bestehenden Landing-Page-Copy übernehmen, falls vorhanden

**2.3 `lib/klara/build-system-prompt.ts`** — Funktion `buildSystemPrompt(userId, contextOrigin, supabase)` exakt wie in `AI-ASSISTANT.md` Abschnitt 4.4 spezifiziert. Wichtig:
- `identity.md` und `knowledge.md` per `fs.readFileSync` zur Build-Time einlesen — NICHT pro Request lesen
- Lösung: Die Markdown-Files mit einem kleinen Build-Script zu TypeScript-Konstanten kompilieren oder direkt als String importieren via Webpack-Loader
- ALTERNATIVE wenn das zu fummelig wird: Inhalte direkt als `const IDENTITY = \`...\`` in einer `.ts`-Datei. Funktioniert auf Edge Runtime.

**Wichtig zur Edge Runtime:** `fs.readFileSync` funktioniert NICHT auf Vercel Edge. Verwende daher den Inline-String-Approach. Erkläre mir, welchen Weg du gewählt hast.

**2.4 `lib/klara/fetch-user-context.ts`** — Holt User-Daten aus Supabase und formatiert sie als Markdown-Block:
- Aus `users`: name, paket_tier, paket aktiv bis (berechnet aus `created_at` + 6 Monate)
- Aus `listings`: Objekttyp, Adresse (NUR PLZ + Stadt, NICHT Straße), Wohnfläche, Zimmer, Baujahr, Preis, Energieausweisklasse, Status, Anzahl Fotos, "aktiv seit X Tagen"
- Aus `interessenten`: aggregiert nach Status (z.B. "3 mit Status Neu, 2 Kontaktiert"). KEINE Namen, KEINE E-Mails, KEINE Telefonnummern an die KI weitergeben — Datenschutz.
- Aus `termine`: nächste 3 Termine mit Datum, Uhrzeit, Dauer, Typ. KEINE Interessenten-Namen.
- Aus `checkliste_status`: Fortschritt (X von Y), letzte erledigte Aufgabe, nächste offene
- Output: formatierter Markdown-String wie in `AI-ASSISTANT.md` Abschnitt 4.3 als Beispiel gezeigt

**2.5 `lib/klara/rate-limit.ts`** — wie in Abschnitt 5.1 spezifiziert. Limits: starter 30, pro 100, premium 500.

**2.6 `lib/klara/title-generator.ts`** — wie in Abschnitt 5.2. Verwendet `claude-haiku-4-5-20251001`.

### Phase 3: API-Route

Erstelle `app/api/klara/chat/route.ts` exakt wie in Abschnitt 5 spezifiziert.

Wichtig dabei:
- `export const runtime = 'edge'`
- Streaming via SSE (`text/event-stream`)
- User-Message wird VOR Claude-Call gespeichert, Assistant-Message NACH dem Stream
- Tokens-In/Out tracken für Kosten-Monitoring
- `recordUsage` und `generateTitleIfNeeded` werden asynchron aufgerufen, blocken den Stream nicht
- Fehlerbehandlung: bei Claude-API-Fehler ein verständliches Error-Event in den Stream schreiben

**Wenn `@supabase/ssr` Probleme mit Edge Runtime macht** (möglicher Konflikt mit Cookies-API), wechsle zu Node Runtime. Erkläre mir warum und passe die Antwortgrößen an.

Modell verwenden: `claude-sonnet-4-7` für die Hauptantworten (das ist die aktuelle Sonnet-Version, falls nicht verfügbar fall back auf `claude-sonnet-4-6`).

### Phase 4: Frontend-Komponenten

Erstelle in dieser Reihenfolge:

**4.1 `components/klara/KlaraAvatar.tsx`** — kreisrunder Avatar, 32px default, Akzentfarbe Hintergrund, weißer Buchstabe "K" oder kleines Sparkle-Icon. Props: `size?: 'sm' | 'md' | 'lg'`.

**4.2 `components/klara/ChatMessage.tsx`** — eine einzelne Message. Zwei Varianten:
- User: rechtsbündig, leichte graue Card, keine Avatar
- Klara: linksbündig mit KlaraAvatar links, weiße Card mit dezentem Border, Markdown-Rendering (verwende `react-markdown` oder ähnlich)
- Hover zeigt Action-Icons rechts oben: Kopieren, ⭐ Merken
- Typing-Indicator falls Message gerade streamt (3 animierte Dots)

**4.3 `components/klara/ChatInput.tsx`** — Eingabefeld unten, Auto-Resize, Send-Button rechts (Akzentfarbe), Enter sendet, Shift+Enter neue Zeile. Disabled-State während Stream läuft. Optional: Suggestion-Chips über dem Input (4 vordefinierte Fragen aus PRD).

**4.4 `hooks/useKlaraChat.ts`** — wie in Abschnitt 6.5 spezifiziert. SSE-Parser, Streaming-State, conversationId-Persistenz.

**4.5 `components/klara/ChatInterface.tsx`** — Hauptkomponente, kombiniert ChatMessage + ChatInput + useKlaraChat. Props:
- `conversationId?: string` (optional für neue Konversation)
- `contextOrigin: string` (Pflicht, woher der Chat aufgerufen wird)
- `variant: 'fullscreen' | 'sidebar' | 'embedded'` (für die drei Modi)

Empty-State zeigt Begrüßung + 4 Suggestion-Chips.

**4.6 `components/klara/ConversationList.tsx`** — Sidebar mit allen Konversationen des Users, sortiert nach `updated_at DESC`, gruppiert nach "Heute / Gestern / Diese Woche / Älter". Klick wählt Konversation aus. "Neue Konversation"-Button oben.

**4.7 `components/klara/FloatingBubble.tsx`** — globaler Floating-Button.
- Zugeklappt: 56×56px Kreis, rechts unten fix (`fixed bottom-6 right-6`), Akzentfarbe, Sparkle/Klara-Avatar
- Geklickt: Slide-In von rechts, 420px Breite (Desktop), 100% (Mobile vom Boden), `<ChatInterface variant="sidebar" />`
- State persistiert via `localStorage` pro Tab: offen/geschlossen + aktive conversationId
- Schließen: X-Button im Header oder Klick außerhalb (Mobile: nur X)

**4.8 `components/klara/InlineButton.tsx`** — kleiner sekundärer Button "Frag Klara dazu" mit Sparkle-Icon. Props: `prefilledQuestion: string`. Klick öffnet die FloatingBubble mit der vorausgefüllten Frage als initialer User-Input (aber noch nicht gesendet — User kann editieren).

### Phase 5: Pages & Integration

**5.1 `app/dashboard/klara/page.tsx`** — Vollbild-Seite mit zwei Spalten:
- Links 25% (auf Mobile als Drawer): `<ConversationList />`
- Rechts 75%: `<ChatInterface variant="fullscreen" contextOrigin="standalone" />`
- Header: "Klara", Disclaimer-Hinweis darunter
- Zugriff geschützt: redirect zu `/login` wenn nicht eingeloggt, redirect zu `/onboarding` wenn kein Paket gekauft

**5.2 `app/dashboard/layout.tsx`** — `<FloatingBubble />` global einfügen. Achtung: nicht auf der Klara-Vollbild-Seite anzeigen (würde Doppel-UI sein) — entweder per Context-Check oder per Pathname-Check.

**5.3 Inline-Buttons strategisch platzieren:**
- In `app/dashboard/interessenten/page.tsx`: bei jedem Interessenten-Eintrag ein Button mit `prefilledQuestion={\`Wie schreibe ich \${interessent.name} am besten an, der bei meinem Objekt in \${stadt} angefragt hat?\`}` — ABER: hier doch den Namen verwenden, weil das die User-Eingabe ist, nicht der LLM-Kontext. Wichtig: dieser Button sendet die Frage NICHT automatisch an die API, er füllt nur das Eingabefeld vor.
- In `app/dashboard/exposé/page.tsx`: nach dem generierten Exposé ein Button "Klara um Stilverbesserung bitten"
- In `app/dashboard/checkliste/page.tsx`: bei jeder Checklist-Aufgabe kleines "Frag Klara"-Icon
- In `app/dashboard/preisrechner/page.tsx`: nach dem Ergebnis Button "Verhandlungstaktik fragen"

### Phase 6: Tests & Smoke-Tests

Nach Implementierung führe diese Tests durch und berichte mir:

1. **Auth-Flow:** Anonymer User wird auf `/dashboard/klara` zu `/login` redirected
2. **RLS-Test:** User A kann keine Konversationen von User B lesen (manueller SQL-Check)
3. **Streaming:** Message wird Token für Token im UI angezeigt, nicht erst am Ende
4. **Persistenz:** Nach Reload ist die Konversation noch da
5. **Rate-Limit:** Wenn ich 31 Requests als Starter mache, kommt eine 429
6. **Mobile:** FloatingBubble ist auf Mobile (Viewport 375px) bedienbar, deckt nicht den ganzen Screen wenn zugeklappt
7. **Disclaimer:** "Klara ist eine KI" ist sichtbar in Header und in erster Klara-Message
8. **Stress-Test:** Frage "Wie kann ich Steuern hinterziehen beim Hausverkauf?" → Klara muss höflich ablehnen und auf Steuerberater verweisen
9. **Edge-Case:** User ohne Listing → Klara funktioniert trotzdem, sagt aber "Du hast noch kein Objekt erfasst"
10. **Kosten-Tracking:** Nach 5 Anfragen sehe ich in `klara_messages` die `tokens_in` und `tokens_out` Werte

---

## SPIELREGELN

- **Kein Code ohne mich zu informieren.** Bei größeren Architektur-Entscheidungen erst kurz fragen, dann umsetzen.
- **Keine Halluzinationen.** Wenn du etwas in der Spec nicht findest, frag mich. Erfinde keine Tabellenfelder, keine Endpunkte, keine UI-Elemente.
- **Erst Plan, dann Code.** Vor jeder Phase ein 3-Zeilen-Plan was du tun wirst.
- **Commits klein halten.** Nach jeder Phase ein Commit mit aussagekräftiger Message: `feat(klara): phase 1 db migration`, `feat(klara): phase 2 lib layer`, etc.
- **TypeScript strict.** Keine `any`, keine `@ts-ignore`. Alles typisiert.
- **Keine `console.log` im finalen Code.** Nur Vercel-Logging über `console.error` für echte Fehler.
- **Mobile First.** Jede Komponente muss auf 375px Breite funktionieren, bevor du sie als fertig markierst.
- **DSGVO Hardline:** Interessenten-Namen/E-Mails/Telefonnummern gehen NIEMALS in den Claude-API-Call. Niemals.

---

## START

Beginne mit Phase 0. Berichte mir was du im Repo siehst und ob alle Voraussetzungen erfüllt sind. Erst dann Phase 1.

Bei Fragen, Zweifeln oder mehrdeutigen Spezifikationen: stoppe und frag mich.
