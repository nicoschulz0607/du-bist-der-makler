# Pricing-Section Redesign — du-bist-der-makler.de

## Kontext

Ich arbeite an der Pricing-Section von `du-bist-der-makler.de`. Die aktuelle Version sieht zu generisch und wenig "premium" aus, vor allem im Vergleich zu Konkurrenz-Pricing-Pages (Submagic, Raycast, Liveblocks, EZQL). Die "Empfohlen"-Karte hebt sich nicht stark genug ab, der Section-Hintergrund ist hellgrau und flach, und der Preis-Bereich hat zu wenig visuelle Energie.

Außerdem soll ein **Tool-Paket** ab 39 € (einmalig, wird beim späteren Paket-Kauf angerechnet) als sekundäres Angebot direkt unter den drei Pricing-Karten platziert werden — analog zum Pattern von Liveblocks (Satelliten-Block), nicht als vierte Karte.

## Ziel

Die Pricing-Section so umbauen, dass:

1. Die Pro-Karte (Empfohlen) visuell radikal dominanter ist — durch Inversion, nicht nur durch ein Badge.
2. Der Section-Hintergrund Tiefe bekommt (dunkler Hintergrund bevorzugt, alternativ cremefarben mit dezentem Pattern).
3. Der Preis-Bereich mehr Drama bekommt (größere Zahl, € als Superscript, ggf. Spar-Badge bei längeren Laufzeiten).
4. Die drei Karten sich typographisch oder über kleine Akzente unterscheiden, statt drei identische Layouts zu sein.
5. Das Tool-Paket-Angebot als horizontaler Block direkt unter den Karten sitzt — klar untergeordnet, aber gut sichtbar.

## Tech-Stack

- Next.js 14+ (App Router)
- Tailwind CSS
- Framer Motion für Animationen (kein GSAP)
- Komponenten als React Server Components wo möglich
- Bestehende Brand-Farben aus dem Design-System nutzen (Grün als Primärfarbe)

## Konkrete Anforderungen

### 1. Pricing-Karten

**Drei Karten:** Basic (129 €), Pro (169 €, empfohlen), Premium (219 €).

**Layout:**
- Section-Hintergrund: dunkles Anthrazit/Dunkelgrün (z. B. `#0D1F1A` oder `#0A0A0B`) — oder cremefarbener Hintergrund mit dunkler Pro-Karten-Inversion. Bitte beide Varianten als separate Komponenten anbieten, ich entscheide nach Sichtung.
- Karten in einem 3-Spalten-Grid mit ca. 12px Gap.
- Basic + Premium: dezente Karten mit niedrigem Kontrast zum BG (z. B. `bg-white/4` auf dunkel, `border-white/8`).
- Pro-Karte: voll gefüllt mit Brand-Grün (`#1D9E75` o. ä.), weiße Schrift, weißer CTA-Button mit grüner Schrift.

**Empfohlen-Badge:**
- Sitzt oben mittig, halb über den oberen Rand der Pro-Karte hinausragend.
- Weißer Hintergrund, dunkelgrüne Schrift, Pill-Form, mit Stern-Icon.

**Preis-Darstellung:**
- Große Zahl (ca. 38–42 px), `font-weight: 500`, leicht negatives Letter-Spacing.
- € als kleineres Superscript bzw. mit `align-items: baseline` und kleinerer Schriftgröße.
- Subtext "1 Monat · X €/Monat" in muted Farbe darunter.
- Bei 3 / 6 Monaten optional ein Spar-Badge daneben ("Spare 60 €") in semantischem Grün-Akzent.

**Feature-Liste:**
- Trennlinie über der Liste (`border-top` mit niedriger Opacity).
- Check-Icons in Brand-Grün (auf dunklen Karten) bzw. Weiß (auf der Pro-Karte).
- Schriftgröße 13–14 px, line-height ca. 1.6.

**CTAs:**
- Basic + Premium: Outline-Buttons (transparent, 0.5px Border).
- Pro: Solid weißer Button mit dunkelgrüner Schrift + Pfeil-Icon.
- Alle Buttons mit Pill-Form (`border-radius: 999px`).

**Laufzeit-Toggle:**
- Drei Optionen oben mittig: 1 Monat / 3 Monate / 6 Monate.
- Aktive Option als Pill mit Brand-Grün gefüllt, Rest transparent mit muted Schrift.
- Toggle-Container selbst hat einen dezenten Hintergrund (`bg-white/6`) und Padding 4px.

**Warnhinweis:**
- Bei "1 Monat" bleibt der gelbe Hinweis-Block ("Immobilien verkaufen sich im Durchschnitt in 4–6 Monaten…"), aber dezenter — z. B. mit dunkelgelbem Hintergrund (`#3D2E0A` o. ä.) und gedämpfter Schrift, damit er sich auf dem dunklen BG natürlich einfügt.

### 2. Tool-Paket-Block (direkt unter den Karten)

Horizontaler Block über die volle Breite des Containers:

- Dezenter Hintergrund (noch schwächer als die Pricing-Karten, z. B. `bg-white/3`).
- Gestrichelter Border (`border-dashed`, 0.5px) — signalisiert "alternativ/Add-on".
- Border-Radius gleich wie bei den Karten (14–16 px).
- Padding ca. 1.25rem 1.5rem.

**Inhalt:**
- Links: kleines Icon (z. B. Layers- oder Tool-Icon, 36×36 px Container mit `bg-green-500/15`, Icon in Mid-Green).
- Daneben: zweizeilige Headline + Subline.
  - Headline: "Nur einzelne KI-Tools? Tool-Paket ab 39 €" (14 px, weight 500, weiß).
  - Subline: "Einmalzahlung — wird beim späteren Paket-Kauf vollständig angerechnet." (12 px, muted).
- Rechts: Outline-Button "Tool-Paket ansehen →".

**Verhalten:**
- Auf Mobile: Icon + Text untereinander, Button volle Breite drunter.
- Optional: Klick auf den Block expandiert eine Liste der enthaltenen Tools (KI-Chatbot, Exposé-Generator, Bildverbesserung etc.) als Akkordeon.

### 3. Footer-Hinweise

Unter dem Tool-Paket-Block bleiben die bestehenden Hinweise:
- "Nach Ablauf: Basic 149 € · Pro 199 € · Premium 259 € pro Monat — monatlich kündbar."

In muted Schrift (12 px), zentriert.

## Design-Tokens

```ts
// Bitte als Konstanten am Anfang der Komponente definieren
const colors = {
  bgDark: '#0D1F1A',          // Section-Hintergrund (dunkle Variante)
  bgCream: '#FAF7F2',         // Section-Hintergrund (helle Variante)
  brandGreen: '#1D9E75',      // Pro-Karten-Fill, Active-States
  brandGreenDark: '#0F6E56',  // Pro-Schrift auf weißen Akzenten
  brandGreenLight: '#5DCAA5', // Check-Icons auf dunklen Karten
  warning: '#3D2E0A',         // Warning-Block-BG (dunkle Variante)
};

const radii = {
  card: '14px',
  pill: '999px',
};
```

## Animationen (Framer Motion)

- Karten beim Scroll-In: `opacity 0 → 1`, `y: 20 → 0`, `stagger 0.08s` zwischen den Karten.
- Pro-Karte zusätzlich mit leichtem `scale: 0.98 → 1`.
- Hover auf Basic/Premium-Karten: `border-color` von 8% auf 20% Opacity (200ms ease).
- Hover auf Pro-Karte: nichts — sie ist schon der Hero-State.
- Laufzeit-Toggle-Wechsel: Preise faden mit `opacity` aus/ein (150ms), Zahlen werden mit `key`-Prop auf den State gebunden, damit Framer Motion sie als neue Elemente behandelt.

## Output

Bitte liefere:

1. Eine `Pricing.tsx` Komponente (Server Component wo möglich, Client Component nur für den Toggle-State).
2. Bei Bedarf eine `PricingCard.tsx` und `ToolPackBanner.tsx` als Sub-Komponenten.
3. Tailwind-Klassen, keine separaten CSS-Files.
4. Beide Varianten (dunkel + hell) als separate Komponenten oder via Prop steuerbar.

## Wichtig

- **Keine Gradients, keine Glow-Effekte, keine schweren Schatten.** Flat, clean, hochwertig — nicht spielerig.
- **Sentence case** für alle Texte, nie ALL CAPS außer bei den drei Tier-Labels (BASIC / PRO / PREMIUM).
- **Schriftgewichte: nur 400 und 500.** Kein 600, kein 700.
- Mobile-First: ab `md:` 3-Spalten-Grid, drunter gestapelt.
- Touch-Targets mindestens 44×44 px.
- Alle Texte und Preise als Props übergebbar — keine hardgecodeten Strings im Markup.
