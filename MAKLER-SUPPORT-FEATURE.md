# Feature-Spec: Makler-Support Buchung

> **Projekt:** dubistdermakler.de
> **Feature-ID:** PART-02 (aus PRD)
> **Status:** Ready for Implementation
> **Zielgruppe für dieses Dokument:** Claude Code

---

## 1. Kontext & Ziel

Premium-Kunden bekommen eine Stunde persönliche Makler-Beratung inklusive. Pro/Starter-Kunden sowie Premium-Kunden ab der zweiten Stunde zahlen 50€ pro Stunde. Der Makler-Kollege arbeitet werktags 7:00–15:30 Vollzeit, ist also nur abends und am Wochenende verfügbar — das darf für den Kunden aber nicht "sketchy" wirken.

**Lösung:** Statt offener Calendly-Slot-Picker → Anfrage-basierter Flow. Kunde schlägt 2-3 Wunschtermine vor, Makler bestätigt asynchron innerhalb 24h. Wirkt wie professioneller Concierge-Service, schützt den realen Kalender, ehrlich kommuniziert.

---

## 2. User Flow (End-to-End)

### Kunde
1. Geht in `/dashboard/makler-support`
2. Sieht Hero mit Foto + Bio des Maklers, Verfügbarkeitsfenster, SLA-Versprechen
3. Klickt "Anfrage stellen" → Formular
4. Wählt Thema, beschreibt Anliegen, gibt 2-3 Wunschtermine + Telefon an
5. Sendet ab → Bestätigungs-Mail kommt an, Status-Karte zeigt "⏳ Wartet auf Bestätigung"
6. Wartet auf Antwort (max. 24h)
7. Bei Bestätigung: Mail mit Termin + ICS-Datei, ggf. Stripe Payment Link
8. Premium-Kunden mit ungenutzter Inklusiv-Stunde: kein Payment-Schritt

### Makler (Admin)
1. Bekommt Mail mit Anfrage-Details + Link zur Admin-View
2. Öffnet `/admin/makler-anfragen`, sieht offene Anfragen
3. Wählt einen der Wunschtermine ODER schlägt Alternative vor
4. Klickt "Bestätigen" → System verschickt Termin-Mail + ggf. Payment Link
5. Status-Update: "bestätigt" → später nach Termin manuell auf "abgeschlossen" setzen

---

## 3. Datenbank-Schema (Supabase)

### Neue Tabelle: `makler_anfragen`

```sql
CREATE TYPE makler_anfrage_thema AS ENUM (
  'preisverhandlung',
  'vertragsfragen',
  'besichtigung',
  'sonstiges'
);

CREATE TYPE makler_anfrage_status AS ENUM (
  'neu',
  'bestätigt',
  'abgelehnt',
  'abgeschlossen'
);

CREATE TABLE makler_anfragen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,

  thema makler_anfrage_thema NOT NULL,
  beschreibung TEXT NOT NULL CHECK (char_length(beschreibung) <= 1000),
  wunschtermine JSONB NOT NULL, -- Array: [{datum: "2026-05-12", tageszeit: "abends"}, ...]
  telefon TEXT NOT NULL,

  status makler_anfrage_status NOT NULL DEFAULT 'neu',
  bestätigter_termin TIMESTAMPTZ,
  bestätigte_dauer_minuten INT DEFAULT 60,

  bezahlt BOOLEAN NOT NULL DEFAULT false,
  inklusiv_stunde_genutzt BOOLEAN NOT NULL DEFAULT false,
  payment_link_sent_at TIMESTAMPTZ,

  admin_notiz TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_makler_anfragen_user_id ON makler_anfragen(user_id);
CREATE INDEX idx_makler_anfragen_status ON makler_anfragen(status);
CREATE INDEX idx_makler_anfragen_created_at ON makler_anfragen(created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER set_makler_anfragen_updated_at
  BEFORE UPDATE ON makler_anfragen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Row Level Security

```sql
ALTER TABLE makler_anfragen ENABLE ROW LEVEL SECURITY;

-- Kunden sehen nur eigene Anfragen
CREATE POLICY "users_read_own_anfragen"
  ON makler_anfragen FOR SELECT
  USING (auth.uid() = user_id);

-- Kunden können eigene Anfragen erstellen
CREATE POLICY "users_create_own_anfragen"
  ON makler_anfragen FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins (E-Mails aus ENV) sehen und ändern alles
-- → wird per Service-Role-Key in API-Routen gemacht, nicht per RLS
```

### Helper-Funktion: Hat User die Inklusiv-Stunde schon genutzt?

```sql
CREATE OR REPLACE FUNCTION user_hat_inklusiv_stunde_genutzt(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM makler_anfragen
    WHERE user_id = check_user_id
      AND inklusiv_stunde_genutzt = true
      AND status IN ('bestätigt', 'abgeschlossen')
  );
$$ LANGUAGE sql STABLE;
```

---

## 4. Environment-Variablen

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PAYMENT_LINK_MAKLER_STUNDE=https://buy.stripe.com/...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_NOREPLY=noreply@dubistdermakler.de
RESEND_FROM_SUPPORT=kontakt@dubistdermakler.de
MAKLER_NOTIFICATION_EMAIL=makler@dubistdermakler.de

# Admin-Auth (kommagetrennt)
ADMIN_EMAILS=nico@dubistdermakler.de,kollege@dubistdermakler.de

# App
NEXT_PUBLIC_APP_URL=https://dubistdermakler.de
```

---

## 5. Routen-Übersicht

### Kunden-Bereich
| Route | Method | Zweck |
|---|---|---|
| `/dashboard/makler-support` | GET | Hauptseite mit Hero + Formular + Verlauf |
| `/api/makler-anfragen` | POST | Neue Anfrage erstellen |
| `/api/makler-anfragen` | GET | Eigene Anfragen abrufen |

### Admin-Bereich
| Route | Method | Zweck |
|---|---|---|
| `/admin/makler-anfragen` | GET | Liste aller Anfragen |
| `/admin/makler-anfragen/[id]` | GET | Detail-Ansicht einer Anfrage |
| `/api/admin/makler-anfragen/[id]/bestätigen` | POST | Termin bestätigen |
| `/api/admin/makler-anfragen/[id]/ablehnen` | POST | Anfrage ablehnen |
| `/api/admin/makler-anfragen/[id]/abschließen` | POST | Nach Termin als erledigt markieren |

---

## 6. Komponenten

### `MaklerSupportHero.tsx`
Server-Komponente, oben auf der `/dashboard/makler-support` Seite.

**Inhalt:**
- Foto des Kollegen (placeholder bis echtes Bild da)
- Name + Bio: "15 Jahre Erfahrung, lizenzierter Makler in [Region]"
- Verfügbarkeit: "Werktags 17–20 Uhr, Samstags 10–14 Uhr"
- SLA: "Antwort auf deine Anfrage innerhalb von 24 Stunden"
- 3 Use-Case-Karten: "Preisverhandlung läuft schief", "Notarvertrag prüfen", "Besichtigung vorbereiten"
- Paket-spezifischer Hinweis-Banner:
  - Premium ohne genutzte Inklusiv-Stunde: 🎁 "Deine erste Stunde ist inklusive"
  - Premium nach genutzter Inklusiv-Stunde: "Erste Stunde genutzt. Weitere Stunden: 50€"
  - Pro/Starter: "50€ pro Stunde — bezahlt vor dem Termin"

### `MaklerAnfrageForm.tsx`
Client-Komponente, Anfrage-Formular.

**Felder:**
- `thema` — Dropdown (4 Optionen)
- `beschreibung` — Textarea, max 1000 Zeichen, Counter sichtbar
- `wunschtermine` — 3 Slot-Felder mit Datum-Picker + Tageszeit-Select (vormittags/nachmittags/abends/wochenende-flexibel)
- `telefon` — Tel-Input mit DE-Format-Validierung

**Validierung:**
- Mindestens 1 Wunschtermin Pflicht, max 3
- Datum muss in der Zukunft liegen
- Bei Werktag-Slots: nur "abends" auswählbar (UI-Hinweis warum)

**Submit:**
- Loading-State während Request
- Bei Erfolg: Form ausblenden, Success-Karte anzeigen
- Bei Fehler: Inline-Fehlermeldung

### `MaklerAnfrageStatusKarte.tsx`
Zeigt aktuelle/letzte Anfrage prominent an.

**Status-Anzeigen:**
- `neu`: ⏳ "Anfrage wartet auf Bestätigung. Antwort innerhalb 24h."
- `bestätigt`: ✅ "Termin bestätigt: [Datum] um [Uhrzeit]" + Button "Zum Kalender hinzufügen" (ICS-Download)
- `abgelehnt`: ❌ "Termin nicht möglich. Bitte stelle eine neue Anfrage." + Notiz vom Makler
- `abgeschlossen`: ✓ "Beratung abgeschlossen am [Datum]"

### `MaklerAnfrageHistorie.tsx`
Liste vergangener Anfragen, kompakt, einklappbar.

### `AdminAnfrageRow.tsx` / `AdminAnfrageDetail.tsx`
Admin-View, simpel gehalten — Tabelle + Detail-Seite mit Buttons:
- "Wunschtermin 1/2/3 bestätigen"
- "Alternative vorschlagen" (textfeld + datepicker)
- "Ablehnen" (mit Notiz)
- "Als abgeschlossen markieren" (für bereits bestätigte Termine)

---

## 7. API-Routen — Implementation

### `POST /api/makler-anfragen`

**Auth:** Session des Kunden (Supabase Auth)

**Body:**
```typescript
{
  thema: 'preisverhandlung' | 'vertragsfragen' | 'besichtigung' | 'sonstiges';
  beschreibung: string; // max 1000
  wunschtermine: Array<{ datum: string; tageszeit: string }>; // 1-3
  telefon: string;
  listing_id?: string;
}
```

**Logik:**
1. Validierung (Zod-Schema)
2. Insert in `makler_anfragen` mit `status: 'neu'`
3. Resend-Mail an `MAKLER_NOTIFICATION_EMAIL` mit Anfrage-Details + Admin-Link
4. Resend-Bestätigungsmail an Kunden ("Anfrage erhalten, Antwort innerhalb 24h")
5. Return: `{ success: true, anfrage_id: ... }`

### `POST /api/admin/makler-anfragen/[id]/bestätigen`

**Auth:** Admin-Check über `ADMIN_EMAILS` Env-Var (User-E-Mail muss in Liste sein)

**Body:**
```typescript
{
  bestätigter_termin: string; // ISO timestamp
  dauer_minuten?: number; // default 60
  admin_notiz?: string;
}
```

**Logik:**
1. Admin-Auth prüfen
2. Anfrage laden, prüfen `status === 'neu'`
3. User laden, prüfen Paket-Tier
4. Falls Premium UND `user_hat_inklusiv_stunde_genutzt(user_id) === false`:
   - Setze `inklusiv_stunde_genutzt: true`
   - Setze `bezahlt: true`
   - **Kein** Payment-Link versenden
5. Sonst:
   - Setze `payment_link_sent_at: now()`
   - Mail an Kunden enthält Stripe Payment Link
6. Update Anfrage: `status: 'bestätigt'`, `bestätigter_termin: ...`
7. Resend-Mail an Kunden mit Termin-Bestätigung + ICS-Anhang
8. Return: `{ success: true }`

### ICS-Datei generieren

Nutze `ics` npm-Paket:

```typescript
import { createEvent } from 'ics';

const event = {
  start: [2026, 5, 12, 18, 0], // [year, month, day, hour, minute]
  duration: { minutes: 60 },
  title: 'Makler-Beratung — dubistdermakler.de',
  description: `Beratung zum Thema: ${thema}\n\n${beschreibung}`,
  location: 'Telefonisch',
  organizer: { name: 'Makler-Team', email: 'makler@dubistdermakler.de' },
  attendees: [{ name: kundeName, email: kundeEmail }],
};
```

---

## 8. Mail-Templates (Resend + React Email)

Alle Templates auf Deutsch, Du-Form, warmer aber professioneller Ton. Akzentfarbe `#1B6B45` aus DESIGN.md.

### `MaklerAnfrageBestätigungKunde.tsx`
**Betreff:** "Deine Anfrage ist bei uns angekommen"

**Inhalt:**
- Persönliche Anrede mit Vorname
- Bestätigung der Anfrage-Details (Thema, Wunschtermine)
- "Wir melden uns innerhalb von 24 Stunden mit einer Bestätigung"
- Footer: Link zum Dashboard

### `MaklerAnfrageNotificationMakler.tsx`
**Betreff:** "Neue Beratungs-Anfrage von [Kunde]"
**An:** `MAKLER_NOTIFICATION_EMAIL`

**Inhalt:**
- Kunden-Name, E-Mail, Telefon
- Paket-Tier des Kunden (Starter/Pro/Premium)
- Thema + komplette Beschreibung
- Alle Wunschtermine
- Hinweis falls Premium mit Inklusiv-Stunde noch verfügbar
- **Großer Button:** "In Admin-View öffnen" → Link zu `/admin/makler-anfragen/[id]`

### `MaklerTerminBestätigung.tsx`
**Betreff:** "Termin bestätigt: [Datum] um [Uhrzeit]"
**Anhang:** ICS-Datei

**Inhalt:**
- "Dein Termin steht!"
- Termin-Details prominent
- Hinweis: "Du bekommst einen Anruf unter [Telefon]"
- Bei zahlungspflichtigen Stunden: **"Bitte schließe vor dem Termin die Zahlung ab"** + Stripe Payment Link Button
- Bei Inklusiv-Stunde: "Diese Beratung ist in deinem Premium-Paket inklusive — keine weitere Zahlung nötig"
- ICS-Hinweis: "Im Anhang findest du eine Kalender-Datei zum Importieren"

### `MaklerAnfrageAblehnung.tsx`
**Betreff:** "Zu deiner Beratungs-Anfrage"

**Inhalt:**
- Höfliche Ablehnung
- Notiz vom Makler (warum, ggf. Alternativ-Vorschlag)
- CTA: "Neue Anfrage stellen"

---

## 9. Paket-Logik im UI

```typescript
// Hilfs-Logik in /dashboard/makler-support/page.tsx

const user = await getCurrentUser();
const inklusivStundeGenutzt = await rpc('user_hat_inklusiv_stunde_genutzt', { check_user_id: user.id });

const showState = (() => {
  if (user.paket_tier === 'premium' && !inklusivStundeGenutzt) {
    return 'premium_inklusiv_verfügbar';
  }
  if (user.paket_tier === 'premium' && inklusivStundeGenutzt) {
    return 'premium_zahlpflichtig';
  }
  return 'standard_zahlpflichtig'; // starter, pro
})();
```

**Anzeige je State:**
- `premium_inklusiv_verfügbar` → Hero zeigt "🎁 Erste Stunde inklusive", Formular ohne Payment-Hinweis
- `premium_zahlpflichtig` → Hero zeigt "Erste Stunde genutzt", Formular mit "50€ wird nach Bestätigung fällig"
- `standard_zahlpflichtig` → Hero zeigt "50€ pro Stunde", optional Upsell-Hint "Premium-Nutzer bekommen die erste Stunde geschenkt"

---

## 10. Admin-Auth (MVP-Ansatz)

Keine Supabase-Roles für MVP. Stattdessen einfacher E-Mail-Check:

```typescript
// lib/auth/isAdmin.ts
export function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim());
  return adminEmails.includes(email);
}

// in API-Route
const session = await getServerSession();
if (!isAdmin(session?.user?.email)) {
  return new Response('Unauthorized', { status: 401 });
}
```

In Phase 2 → migrieren auf Supabase Roles (`admin`, `customer`) oder dediziertes `admins` Table.

---

## 11. Implementierungs-Reihenfolge

1. **Datenbank:** Migration anlegen, RLS-Policies, Helper-Funktion testen
2. **Mail-Templates:** Alle 4 Templates mit React Email erstellen, Test-Mails über Resend-Playground senden
3. **API-Routen:** `POST /api/makler-anfragen` zuerst, dann Admin-Bestätigung
4. **Kunden-UI:** Hero + Form + Status-Karte
5. **Admin-UI:** Tabelle + Detail-View + Buttons
6. **End-to-End-Test:** Mit Test-User durchspielen — Anfrage stellen, als Admin bestätigen, ICS-Mail prüfen, Payment-Link-Flow testen
7. **Stripe-Integration:** Im MVP reicht statischer Payment Link. Webhook für Zahlungs-Bestätigung optional.

---

## 12. Out of Scope (für MVP)

- Eigenes Calendar-Sync (iCal/Google Calendar Push beim Makler) — er trägt Termine selbst ein
- Automatische Erinnerungs-Mails 24h vor Termin (Phase 2 via n8n-Workflow)
- Video-Call direkt auf der Plattform — Beratung läuft telefonisch
- Mehrere Stunden in einer Anfrage — eine Stunde pro Anfrage, weitere = neue Anfrage
- Self-Service Stornierung durch Kunden — geht über Support-E-Mail
- Mehrsprachigkeit — DE only

---

## 13. Definition of Done

- [ ] Migration deployed in Supabase
- [ ] RLS-Policies aktiv und getestet
- [ ] Resend-Domain verifiziert, Test-Mail kommt an
- [ ] Stripe Payment Link erstellt und in Env eingetragen
- [ ] Anfrage-Formular validiert korrekt (Pflichtfelder, Datum-Range)
- [ ] Admin-View nur für Admin-E-Mails zugänglich
- [ ] Inklusiv-Stunde-Logik korrekt: Premium 1x kostenlos, danach Payment-Link
- [ ] ICS-Datei öffnet sich korrekt in Apple Calendar / Google Calendar / Outlook
- [ ] Alle 4 Mail-Templates in Inbox-Test sauber dargestellt (auch Mobile)
- [ ] Manueller End-to-End-Flow erfolgreich: Anfrage → Bestätigung → Payment-Link → ICS-Import

---

## 14. Notizen für Claude Code

- **Design-System:** `DESIGN.md` im Repo-Root strikt befolgen — Akzentfarbe `#1B6B45`, Inter-Font, Airbnb-Spacing
- **Tech-Stack-Konsistenz:** Next.js App Router, Server Components wo möglich, Client nur für interaktive Forms
- **Validierung:** Zod-Schemas auf Client + Server (DRY via shared Schema)
- **Error-Handling:** Bei Resend-Fehler nicht den Anfrage-Insert rollbacken — stattdessen Anfrage-Status `neu` belassen, Admin-Mail später manuell triggern
- **Logging:** Alle Status-Übergänge mit Timestamp in `admin_notiz` festhalten (oder separate `audit_log` Tabelle in Phase 2)
- **Testing:** Mindestens manuell durchspielen für jeden Paket-Tier (Starter, Pro, Premium-frisch, Premium-genutzt)

---

**Spec-Version:** 1.0
**Erstellt:** Mai 2026
**Verknüpfte Docs:** `brain.md`, `PRD.md` (PART-02), `DESIGN.md`
