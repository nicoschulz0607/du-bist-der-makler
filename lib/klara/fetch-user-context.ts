import type { SupabaseClient } from '@supabase/supabase-js'
import { WIZARD_STATIONS } from '@/lib/wizard/config'
import { getKlaraContext } from './context'
import { getWizardHint, formatHintAsText } from './wizard-hints'

export async function fetchUserContext(
  userId: string,
  contextOrigin: string,
  supabase: SupabaseClient, // backward-compat, not used
): Promise<string> {
  const ctx = await getKlaraContext(userId)
  const lines: string[] = []

  // ── Nutzer & Paket ────────────────────────────────────────────────────────
  const name = ctx.user.vorname ?? 'Nutzer'
  const tier = ctx.user.paket_tier
    ? ctx.user.paket_tier.charAt(0).toUpperCase() + ctx.user.paket_tier.slice(1)
    : 'Kein Paket'
  lines.push(`Nutzer: ${name}`)
  lines.push(`Paket: ${tier}`)
  if (ctx.user.paket_aktiv_bis) {
    const datumStr = new Date(ctx.user.paket_aktiv_bis).toLocaleDateString('de-DE')
    const tage = ctx.user.paket_tage_verbleibend
    lines.push(`Paket aktiv bis: ${datumStr}${tage !== null ? ` (noch ${tage} Tage)` : ''}`)
  } else {
    lines.push('Paket aktiv bis: —')
  }

  lines.push('')

  // ── Objekt ────────────────────────────────────────────────────────────────
  if (ctx.listing) {
    const l = ctx.listing
    lines.push('Objekt:')
    lines.push(`- Typ: ${l.objekttyp ?? '—'}`)
    lines.push(`- Lage: ${[l.adresse_plz, l.adresse_ort].filter(Boolean).join(' ') || '—'}`)
    lines.push(`- Wohnfläche: ${l.wohnflaeche_qm ? l.wohnflaeche_qm + ' m²' : '—'}`)
    lines.push(`- Zimmer: ${l.zimmer ?? '—'}`)
    lines.push(`- Baujahr: ${l.baujahr ?? '—'}`)
    lines.push(`- Preis: ${l.preis ? l.preis.toLocaleString('de-DE') + ' €' : '—'}`)
    lines.push(`- Energieausweisklasse: ${l.energieausweis_klasse ?? '—'}`)
    lines.push(`- Status: ${l.status ?? 'draft'} (seit ${l.tage_seit_anlage} Tagen)`)
    lines.push(`- Anzahl Fotos: ${l.foto_anzahl}`)
  } else {
    lines.push('Objekt: Noch kein Objekt erfasst.')
  }

  lines.push('')

  // ── Interessenten ────────────────────────────────────────────────────────
  const { gesamt, nach_status } = ctx.interessenten
  if (gesamt > 0) {
    lines.push(`Interessenten (insgesamt ${gesamt}):`)
    for (const [status, count] of Object.entries(nach_status)) {
      lines.push(`- ${count} mit Status „${status}"`)
    }
  } else {
    lines.push('Interessenten: Noch keine Anfragen.')
  }

  lines.push('')

  // ── Nächste Termine ───────────────────────────────────────────────────────
  if (ctx.termine.naechste.length > 0) {
    lines.push('Nächste Termine:')
    for (const t of ctx.termine.naechste) {
      const dateStr = new Date(t.datum).toLocaleDateString('de-DE')
      lines.push(`- ${dateStr}, ${t.uhrzeit ?? ''} (${t.dauer_min ?? 30} Min, ${t.typ ?? 'Besichtigung'})`)
    }
  } else {
    lines.push('Nächste Termine: Keine geplant.')
  }

  lines.push('')

  // ── Unterlagen ────────────────────────────────────────────────────────────
  const u = ctx.unterlagen
  lines.push('Unterlagen:')
  lines.push(`- Pflichtdokumente: ${u.pflicht_vorhanden} von ${u.pflicht_gesamt} (${u.pflicht_prozent}%)`)
  lines.push(`- Aktive Mappen geteilt: ${u.aktive_mappen}`)

  lines.push('')

  // ── Was zuletzt los war ───────────────────────────────────────────────────
  lines.push('Was zuletzt los war:')
  lines.push(ctx.aktivitaet.woche_zusammenfassung)
  const anfrage = ctx.interessenten.aelteste_unbeantwortete_anfrage
  if (anfrage) {
    lines.push(`Wichtig: ${anfrage.name} wartet seit ${anfrage.wartet_seit_stunden}h auf eine Antwort.`)
  }

  lines.push('')

  // ── Checkliste ────────────────────────────────────────────────────────────
  const c = ctx.checkliste
  if (c.aufgaben_gesamt > 0) {
    lines.push(`Checkliste-Fortschritt: ${c.aufgaben_erledigt} von ${c.aufgaben_gesamt} Aufgaben erledigt (${c.prozent}%).`)
  } else {
    lines.push('Checkliste-Fortschritt: Noch nicht gestartet.')
  }

  lines.push('')
  lines.push(`Kontext-Origin: „${contextOrigin}"`)

  // ── Wizard-Hint (wenn contextOrigin auf eine Station passt) ───────────────
  const matchedStation = WIZARD_STATIONS.find((s) => s.klaraContext === contextOrigin)
  if (matchedStation) {
    const hint = getWizardHint(matchedStation.stationNum, ctx)
    if (hint) {
      lines.push('')
      lines.push('---')
      lines.push(formatHintAsText(matchedStation.stationNum, hint))
    }
  }

  // ── KLARA-VERHALTEN (immer am Ende) ──────────────────────────────────────
  lines.push('')
  lines.push('---')
  lines.push(`KLARA-VERHALTEN (Pflicht beachten):

1. Antworte ZIELGRUPPENGERECHT: Nutzer ist meist 35-60 Jahre, verkauft \
vermutlich zum ersten Mal eine Immobilie, ist nicht tech-affin und \
sucht vor allem Sicherheit. Sprich wie eine erfahrene Bekannte, \
nicht wie ein Anwalt oder ein Behörden-Brief.

2. REZITIERE KEINE LISTEN aus dem Kontext oben. Das ist Hintergrund-Wissen \
für dich. Wenn jemand „Wie ist mein Stand?" fragt, NICHT alle Punkte \
aufzählen, sondern das Wichtigste herausgreifen.

3. Wenn eine UNBEANTWORTETE ANFRAGE im Kontext steht (Bereich „Was zuletzt \
los war"), erwähne sie aktiv — das ist das, was den Verkauf voranbringt.

4. KNAPP UND WARM, nicht umfassend. Wenn der Nutzer Details will, fragt \
er nach. Lieber zurückfragen „Soll ich dir das genauer erklären?" als \
alles auf einmal raushauen.

5. KEINE DROHUNGEN, KEINE BUSSGELD-WARNUNGEN unaufgefordert. Pflichten \
freundlich erklären, nicht mit Konsequenzen drohen. Beispiel: \
Statt „Bußgeld bis 15.000 €" sage „Der Käufer braucht das beim Termin."

6. KEINE RECHTSBERATUNG. Bei rechtlichen Fragen: „Für so was ist ein \
Notar oder Anwalt der richtige Ansprechpartner — willst du, dass ich \
dir bei der Suche helfe?"`)

  return lines.join('\n')
}
