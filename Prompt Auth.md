# Claude Code Prompt — Auth-Seiten (Login & Registrierung)
# du-bist-der-makler.de

Kopiere alles ab hier direkt in Claude Code.

---

## Kontext

Ich baue eine Next.js Plattform für privaten Immobilienverkauf ohne Makler.
Die Landing Page existiert bereits. Jetzt sollen Login- und Registrierungsseiten
gebaut werden, die nahtlos zum bestehenden Design passen.

Das Design-System ist in `DESIGN.md` im Repo-Root definiert. Lese diese Datei
zuerst bevor du irgendetwas baust.

**Tech Stack:**
- Next.js (App Router)
- Tailwind CSS
- Supabase Auth (@supabase/ssr)
- TypeScript

---

## Was gebaut werden soll

### 1. `/login` — Login-Seite

**Layout:**
- Zweispaltig auf Desktop: Links visuelle Seite, rechts Formular
- Einspaltig auf Mobile: nur Formular, kein visueller Bereich
- Linke Seite (nur Desktop): dunkelgrüner Hintergrund (#1B6B45), weißes Logo
  oben links, großes Zitat mittig z.B. "Du zahlst einmal. Du verkaufst selbst.",
  unten ein echter Testimonial-Snippet (fiktiv für MVP: Name, Ort, Stern-Rating)
- Rechte Seite: weißer Hintergrund, Formular zentriert, max-width 400px

**Formular-Felder:**
- E-Mail (type="email", autocomplete="email")
- Passwort (type="password", autocomplete="current-password", Toggle Sichtbarkeit)
- "Angemeldet bleiben" Checkbox
- Primary Button: "Einloggen" (volle Breite, Farbe #1B6B45)
- Link unter Button: "Noch kein Konto? Jetzt registrieren" → /registrieren
- Link: "Passwort vergessen?" → /passwort-vergessen (Seite kommt später, Link
  trotzdem setzen)

**Verhalten:**
- Supabase Auth: `signInWithPassword({ email, password })`
- Loading-State: Button zeigt Spinner + "Wird eingeloggt..."
- Fehler inline anzeigen (nicht als Toast):
  - "E-Mail oder Passwort falsch" bei auth-Fehler
  - "Bitte bestätige zuerst deine E-Mail-Adresse" bei unbestätigter E-Mail
- Nach erfolgreichem Login:
  - Wenn kein aktives Paket (`paket_tier` ist null): redirect zu `/onboarding`
  - Wenn Paket aktiv: redirect zu `/dashboard`
- Wenn bereits eingeloggt: sofort redirect zu `/dashboard`

---

### 2. `/registrieren` — Registrierungs-Seite

**Layout:** Identisch zu Login — gleiche Zweispalten-Struktur, gleiche linke Seite.
Nur das Formular rechts unterscheidet sich.

**Formular-Felder:**
- Vorname (type="text", autocomplete="given-name")
- E-Mail (type="email", autocomplete="email")
- Passwort (type="password", autocomplete="new-password", Toggle Sichtbarkeit)
  - Passwort-Stärke-Indikator: 3 Balken (schwach / mittel / stark), Farbe
    rot/gelb/grün, erscheint beim Tippen
  - Anforderung: min. 8 Zeichen (inline hint, kein Tooltip)
- Checkbox: "Ich akzeptiere die [AGB] und [Datenschutzerklärung]" (Links zu
  /agb und /datenschutz, Pflichtfeld)
- Primary Button: "Konto erstellen" (volle Breite)
- Link unter Button: "Bereits registriert? Einloggen" → /login

**Verhalten:**
- Supabase Auth: `signUp({ email, password, options: { data: { vorname } } })`
- Loading-State: Button zeigt Spinner + "Konto wird erstellt..."
- Nach Absenden: Erfolgs-State (kein Redirect):
  - Formular ausblenden
  - Großes grünes Häkchen-Icon
  - Text: "Fast geschafft! Wir haben dir eine Bestätigungs-E-Mail geschickt.
    Bitte klicke auf den Link in der E-Mail um dein Konto zu aktivieren."
  - Kleiner Hinweis: "Keine E-Mail erhalten? Prüfe deinen Spam-Ordner."
- Fehler inline:
  - "Diese E-Mail-Adresse ist bereits registriert" → Link zu /login anzeigen
  - Validierungsfehler pro Feld direkt unter dem Feld

---

### 3. Supabase Client Setup

Falls noch nicht vorhanden, erstelle:

**`/lib/supabase/client.ts`**
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`/lib/supabase/server.ts`**
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )
}
```

**`/middleware.ts`** (falls noch nicht vorhanden):
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Geschützte Routen: Redirect zu Login wenn nicht eingeloggt
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Auth-Seiten: Redirect zu Dashboard wenn bereits eingeloggt
  if (user && (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/registrieren'
  )) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/registrieren', '/onboarding'],
}
```

---

## Design-Anforderungen (Wichtig!)

- Lese `DESIGN.md` im Repo-Root für alle Tokens (Farben, Spacing, Typografie)
- Akzentfarbe: `#1B6B45` (Dunkelgrün), Hover: `#145538`
- Font: Inter oder was in DESIGN.md definiert ist
- Die linke Spalte soll subtil wirken — kein generisches Stock-Foto, stattdessen:
  - Dunkelgrüner Hintergrund
  - Großes, leicht transparentes Haus-Icon als Hintergrundgrafik (SVG, opacity 0.08)
  - Weißer Text, Zitat und Testimonial
- Input-Felder: klares Fokus-Ring in `#1B6B45`, keine blauen Browser-Defaults
- Alle Übergänge: `transition-all duration-200`
- Formular-Fehler: roter Text + roter Border am Input-Feld
- Mobile: Navigation-Header mit Logo und "Zurück zur Startseite" Link

---

## Datei-Struktur die entstehen soll

```
app/
  login/
    page.tsx          ← Login-Seite (Client Component)
  registrieren/
    page.tsx          ← Registrierungs-Seite (Client Component)
  auth/
    callback/
      route.ts        ← Supabase Auth Callback (für E-Mail-Bestätigung)
lib/
  supabase/
    client.ts
    server.ts
middleware.ts
```

**Auth Callback Route** (`/app/auth/callback/route.ts`):
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
```

---

## Was du NICHT bauen sollst (für jetzt)

- Keine Passwort-vergessen-Seite (nur Link setzen)
- Kein Google/Social Login
- Kein 2FA
- Kein Onboarding-Flow (kommt separat)
- Kein Dashboard (kommt separat)

---

## Abschluss-Check

Wenn fertig, stelle sicher:
1. Login funktioniert mit Test-User in Supabase
2. Registrierung legt User in Supabase Auth an
3. Nach Login Redirect zu /dashboard oder /onboarding korrekt
4. Middleware blockt /dashboard ohne Login
5. Mobile-Ansicht sauber (nur Formular, kein Split-Layout)
6. Keine TypeScript-Fehler (`tsc --noEmit`)