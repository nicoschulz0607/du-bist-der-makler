import type { SupabaseClient } from '@supabase/supabase-js'

export async function fetchUserContext(
  userId: string,
  contextOrigin: string,
  supabase: SupabaseClient
): Promise<string> {
  const lines: string[] = []

  // Profile + Paket
  const { data: profile } = await supabase
    .from('profiles')
    .select('vorname, paket_tier, created_at')
    .eq('id', userId)
    .single()

  if (profile) {
    const name = profile.vorname || 'Nutzer'
    const tier = profile.paket_tier ? capitalize(profile.paket_tier) : 'Kein Paket'
    let paketBis = '—'
    if (profile.created_at) {
      const d = new Date(profile.created_at)
      d.setMonth(d.getMonth() + 6)
      const daysLeft = Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000))
      paketBis = `${d.toLocaleDateString('de-DE')} (noch ${daysLeft} Tage)`
    }
    lines.push(`Nutzer: ${name}`)
    lines.push(`Paket: ${tier}`)
    lines.push(`Paket aktiv bis: ${paketBis}`)
  } else {
    lines.push('Nutzer: unbekannt')
    lines.push('Paket: kein aktives Paket')
  }

  lines.push('')

  // Listing
  const { data: listing } = await supabase
    .from('listings')
    .select(`
      id, objekttyp, adresse_strasse, adresse_plz, adresse_ort, wohnflaeche_qm, zimmer,
      baujahr, preis, energieausweis_klasse, energieausweis_status, status, fotos,
      expose_html, grundriss_url, created_at
    `)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (listing) {
    const daysSince = listing.created_at
      ? Math.floor((Date.now() - new Date(listing.created_at).getTime()) / 86400000)
      : 0
    const fotoCount = Array.isArray(listing.fotos) ? listing.fotos.length : 0
    lines.push('Objekt:')
    lines.push(`- Typ: ${listing.objekttyp ?? '—'}`)
    lines.push(`- Lage: ${listing.adresse_plz ?? ''} ${listing.adresse_ort ?? ''}`.trim() || '- Lage: —')
    lines.push(`- Wohnfläche: ${listing.wohnflaeche_qm ? listing.wohnflaeche_qm + ' m²' : '—'}`)
    lines.push(`- Zimmer: ${listing.zimmer ?? '—'}`)
    lines.push(`- Baujahr: ${listing.baujahr ?? '—'}`)
    lines.push(`- Preis: ${listing.preis ? listing.preis.toLocaleString('de-DE') + ' €' : '—'}`)
    lines.push(`- Energieausweisklasse: ${listing.energieausweis_klasse ?? '—'}`)
    lines.push(`- Status: ${listing.status ?? 'draft'} (seit ${daysSince} Tagen)`)
    lines.push(`- Anzahl Fotos: ${fotoCount}`)
  } else {
    lines.push('Objekt: Noch kein Objekt erfasst.')
  }

  lines.push('')

  // Interessenten (nur Zahlen, keine Namen/E-Mails — DSGVO)
  const { data: interessenten } = await supabase
    .from('interessenten')
    .select('status')
    .eq('listing_id', listing?.id ?? '00000000-0000-0000-0000-000000000000')

  if (interessenten && interessenten.length > 0) {
    const counts: Record<string, number> = {}
    for (const i of interessenten) counts[i.status] = (counts[i.status] ?? 0) + 1
    lines.push(`Interessenten (insgesamt ${interessenten.length}):`)
    for (const [status, count] of Object.entries(counts)) {
      lines.push(`- ${count} mit Status „${status}"`)
    }
  } else {
    lines.push('Interessenten: Noch keine Anfragen.')
  }

  lines.push('')

  // Termine (nur die nächsten 3, keine Interessenten-Namen)
  const heute = new Date().toISOString().split('T')[0]
  const { data: termine } = await supabase
    .from('termine')
    .select('datum, uhrzeit, dauer_min, typ')
    .gte('datum', heute)
    .order('datum', { ascending: true })
    .order('uhrzeit', { ascending: true })
    .limit(3)

  if (termine && termine.length > 0) {
    lines.push('Nächste Termine:')
    for (const t of termine) {
      const dateStr = new Date(t.datum).toLocaleDateString('de-DE')
      lines.push(`- ${dateStr}, ${t.uhrzeit ?? ''} (${t.dauer_min ?? 30} Min, ${t.typ ?? 'Besichtigung'})`)
    }
  } else {
    lines.push('Nächste Termine: Keine geplant.')
  }

  lines.push('')

  // Checkliste-Fortschritt
  const { data: checkStatus } = await supabase
    .from('checkliste_status')
    .select('aufgabe_id, completed, completed_at')
    .eq('user_id', userId)

  if (checkStatus) {
    const done = checkStatus.filter(c => c.completed).length
    const total = checkStatus.length
    lines.push(`Checkliste-Fortschritt: ${done} von ${total} Aufgaben erledigt (${total > 0 ? Math.round(done / total * 100) : 0}%).`)
  } else {
    lines.push('Checkliste-Fortschritt: Noch nicht gestartet.')
  }

  lines.push('')
  lines.push(`Kontext-Origin: „${contextOrigin}"`)

  // Wizard station context — injected when user is in the guided wizard
  const wizardMatch = contextOrigin.match(/wizard:station_(\d+)_/)
  if (wizardMatch) {
    const stationNum = parseInt(wizardMatch[1])
    lines.push('')
    lines.push('---')
    lines.push(buildWizardStationGuidance(stationNum, listing, profile))
  }

  return lines.join('\n')
}

function buildWizardStationGuidance(stationNum: number, listing: any, profile: any): string {
  const g: string[] = []
  g.push(`## WIZARD-STATION ${stationNum} — Dein Fokus jetzt`)
  g.push('')

  switch (stationNum) {
    case 1:
      g.push('Station 1: Willkommen & Standortbestimmung.')
      g.push('Der Nutzer startet seinen Verkaufs-Wizard mit 3 Orientierungsfragen (erste Immobilie? Zeithorizont? Tempo?). Das Quiz personalisiert den weiteren Ablauf.')
      g.push('')
      g.push('DEINE AUFGABE: Mach Lust auf den Prozess. Erkläre kurz was den Nutzer im Wizard erwartet und warum strukturiertes Vorgehen beim Privatverkauf so viel ausmacht.')
      break

    case 2:
      g.push('Station 2: Persönliche Eckdaten.')
      g.push('Der Nutzer trägt Vorname, Nachname, Telefon, E-Mail, Anschrift ein. Diese Daten erscheinen später im Exposé-PDF und im Kontaktblock des Inserats.')
      g.push('')
      g.push(`STATUS: Vorname ${profile?.vorname ? `"${profile.vorname}" ✓` : '✗ noch nicht gesetzt'}.`)
      g.push('')
      g.push('RECHTLICHES: Name + Kontaktmöglichkeit sind Pflicht (Fernkommunikation). Im Privatverkauf weniger streng als gewerblich, aber unbedingt empfehlenswert. Eine Mobilnummer reicht.')
      break

    case 3: {
      g.push('Station 3: Objekt-Grunddaten.')
      g.push('Objekttyp, Adresse (mit Geocoding), Wohnfläche, Zimmer, Baujahr, Zustand.')
      g.push('')
      const checks: string[] = []
      if (!listing) {
        checks.push('✗ Noch kein Objekt angelegt — muss in dieser Station erstellt werden')
      } else {
        if (!listing.adresse_strasse) checks.push('✗ Straßenadresse fehlt')
        if (!listing.wohnflaeche_qm) checks.push('✗ Wohnfläche fehlt (Pflicht)')
        if (!listing.zimmer) checks.push('✗ Zimmeranzahl fehlt (Pflicht)')
        if (!listing.objekttyp) checks.push('✗ Objekttyp fehlt')
        if (!listing.baujahr) checks.push('⚠ Baujahr fehlt (wichtig für Preisschätzung)')
      }
      if (checks.length > 0) {
        g.push('FEHLENDE DATEN:')
        g.push(...checks)
      } else {
        g.push('STATUS: ✓ Alle Pflichtdaten eingetragen.')
      }
      g.push('')
      g.push('TIPP: Die Adresse wird für die Marktdatenabfrage in Station 4 gebraucht. Auf Wunsch kann die Straße im Inserat ausgeblendet werden (nur PLZ + Ort zeigen).')
      break
    }

    case 4:
      g.push('Station 4: Lage & Umgebung (passiv).')
      g.push('KI analysiert die Lage: Lage-Score, Geräuschpegel, ÖPNV, Schulen, Vergleichsangebote. Kein User-Input nötig.')
      g.push('')
      g.push('ERKLÄRE: Lage macht 30–40% des Immobilienwerts aus. Guter ÖPNV, Schulen, geringe Lärmbelastung erhöhen den Wert. Der Lage-Score hilft beim Preisargumentieren mit Interessenten.')
      g.push('TIPP: Selbst bei "mittelmäßiger" Lage gibt es immer Stärken — hilf dem Nutzer diese zu sehen.')
      break

    case 5: {
      g.push('Station 5: Marktwert ermitteln.')
      g.push('KI liefert eine Preisspanne. Der Nutzer setzt seinen Verkaufspreis per Slider.')
      g.push('')
      const preis = listing?.preis
      g.push(`STATUS: Preis ${preis ? `✓ gesetzt: ${preis.toLocaleString('de-DE')} €` : '✗ noch nicht festgelegt'}.`)
      g.push('')
      g.push('WICHTIG: Zu hoher Preis → "Preisstigma" → im Schnitt +4 Monate Verkaufsdauer. Zu niedrig → Geld verloren. Empfehlung: Mit Markt-Oberkante starten, nach 3–4 Wochen ohne Angebote anpassen.')
      g.push('Verhandlungspuffer von 3–5% einkalkulieren ist normal und wird von Käufern erwartet.')
      break
    }

    case 6: {
      g.push('Station 6: Energieausweis.')
      g.push('Drei Optionen: (a) Upload eines vorhandenen, (b) Neu bestellen, (c) Nachreichen.')
      g.push('')
      const eaStatus = listing?.energieausweis_status
      g.push(`STATUS: ${eaStatus ? `"${eaStatus}"` : 'noch nicht gesetzt'}.`)
      g.push('')
      g.push('RECHTLICHES: Energieausweis ist Pflicht (GEG §80). Muss spätestens bei Besichtigung vorliegen. Bußgeld bis 15.000 € bei Nichtvorlage.')
      g.push('PRAKTISCH: Online-Bestellung 2–3 Werktage, ca. 50–150 €. Verbrauchsausweis (günstiger) vs. Bedarfsausweis (für Gebäude vor 1977 oder ≤4 Wohneinheiten mit Niedrigenergiebauweise erforderlich).')
      break
    }

    case 7: {
      g.push('Station 7: Fotos hochladen.')
      g.push('Drag-and-drop, KI erkennt Raumtyp, Sortierung per Drag. Mindestens 1 Pflicht, ideal 8–15.')
      g.push('')
      const fotoCount = Array.isArray(listing?.fotos) ? (listing.fotos as unknown[]).length : 0
      if (fotoCount === 0) {
        g.push(`STATUS: ⚠️ Keine Fotos hochgeladen. Mindestens 1 Foto ist Pflicht für die Veröffentlichung.`)
      } else if (fotoCount < 5) {
        g.push(`STATUS: ⚠️ Nur ${fotoCount} Foto${fotoCount === 1 ? '' : 's'} — Inserate mit 8+ Fotos haben deutlich mehr Anfragen.`)
      } else if (fotoCount < 8) {
        g.push(`STATUS: ${fotoCount} Fotos — gut, aber 8–15 wäre ideal.`)
      } else {
        g.push(`STATUS: ✓ ${fotoCount} Fotos hochgeladen — sehr gut!`)
      }
      g.push('')
      g.push('FOTO-TIPPS: Tageslicht, Querformat, aufgeräumt, keine Personen/Spiegel. Pflicht-Räume: Wohnzimmer, Küche, Bad, Schlafzimmer, Außenansicht.')
      g.push('IMPACT: 8+ Fotos = ~30% schnellerer Verkauf und bis zu 5% höherer Preis laut Studien.')
      break
    }

    case 8: {
      g.push('Station 8: Grundriss (optional).')
      g.push('Upload eines Grundrisses als Bild oder PDF. Drei Optionen: hochladen / keiner vorhanden / nachreichen.')
      g.push('')
      g.push(`STATUS: ${listing?.grundriss_url ? '✓ Grundriss hochgeladen' : '✗ Kein Grundriss vorhanden'}.`)
      g.push('')
      g.push('WARUM WICHTIG: Grundriss erhöht die Anfragequote signifikant — viele Interessenten entscheiden anhand des Grundrisses ob sie besichtigen wollen.')
      g.push('KEINE HABEN? Roomle.com oder Floorplanner kostenlos nutzbar. Eine handgezeichnete Skizze mit Maßen funktioniert auch.')
      break
    }

    case 9: {
      g.push('Station 9: Ausstattung & Beschreibung.')
      g.push('Checkbox-Grid für Ausstattungsmerkmale + optionaler Freitext.')
      g.push('')
      const beschreibung = listing?.beschreibung
      g.push(`STATUS: Beschreibungstext ${beschreibung ? '✓ vorhanden' : '✗ noch nicht ausgefüllt (KI generiert ihn in Station 10 automatisch)'}.`)
      g.push('')
      g.push('AGG-HINWEIS: Im Inserat keine Bezugnahme auf Herkunft, Religion, Alter, Geschlecht, Behinderung — auch nicht indirekt. "Ruhige Familie bevorzugt" ist problematisch.')
      g.push('SCHREIBTIPP: Emotional starten ("Sonnendurchflutetes Eckwohnzimmer mit Südbalkon"), dann sachlich mit konkreten Fakten. Keine Floskeln wie "traumhaft" oder "einzigartig".')
      break
    }

    case 10: {
      g.push('Station 10: Inserat-Texte generieren.')
      g.push('KI generiert Titel, Kurzbeschreibung, Volltext, Highlights. Alle direkt editierbar.')
      g.push('')
      g.push(`STATUS: KI-Texte ${listing?.expose_html ? '✓ bereits generiert' : '✗ noch nicht generiert'}.`)
      g.push('')
      g.push('TITEL-TIPPS: Max 80 Zeichen, ein konkretes Highlight, keine Floskeln. Gut: "Gepflegte 3-Zimmer-Wohnung mit Balkon — 72 m² in Bogenhausen". Schlecht: "Traumwohnung zu verkaufen".')
      g.push('TEXTE KÖNNEN nach der Generierung manuell bearbeitet werden. Die KI-Überarbeitungen bleiben gespeichert — auch wenn die KI neu generiert wird (separate Felder).')
      break
    }

    case 11: {
      g.push('Station 11: Vorschau & Rechtscheck.')
      g.push('Letzte Pflicht-Station. Links: Live-Vorschau. Rechts: Checkliste mit Links zu betroffenen Stationen.')
      g.push('')
      const issues: string[] = []
      if (!listing) {
        issues.push('✗ Kein Objekt erfasst (→ Station 3)')
      } else {
        if (!listing.preis) issues.push('✗ Kein Preis gesetzt (→ Station 5)')
        if (!listing.wohnflaeche_qm) issues.push('✗ Keine Wohnfläche (→ Station 3)')
        const photos = Array.isArray(listing.fotos) ? (listing.fotos as unknown[]).length : 0
        if (photos === 0) issues.push('✗ Keine Fotos hochgeladen (→ Station 7)')
        if (!listing.expose_html) issues.push('✗ Keine Inserat-Texte generiert (→ Station 10)')
        if (!listing.energieausweis_status || listing.energieausweis_status === 'nachzureichen') {
          issues.push('⚠ Energieausweis wird nachgereicht — bei Besichtigung vorlegen!')
        }
      }
      if (issues.length > 0) {
        g.push('OFFENE PUNKTE:')
        g.push(...issues)
      } else {
        g.push('STATUS: ✓ Alle Pflichtfelder ausgefüllt — bereit zur Veröffentlichung!')
      }
      g.push('')
      g.push('PFLICHTANGABEN: Energieausweis-Daten (wenn vorhanden), Provisionsfreiheit explizit angeben, Anbieter-Identifikation (Name + Kontakt).')
      break
    }

    case 12:
      g.push('Station 12: Veröffentlichen.')
      g.push('Der Nutzer schaltet sein Inserat jetzt live. Das ist der Zielmoment.')
      g.push('')
      g.push('NACH DER VERÖFFENTLICHUNG — was kommt als nächstes:')
      g.push('- Erste Anfragen kommen typischerweise in 24–72h')
      g.push('- Alle Anfragen im Interessenten-CRM direkt verwalten (Pro/Premium)')
      g.push('- Reaktionszeit beeinflusst Kaufentscheidung — schnell antworten!')
      g.push('- Gruppen-Besichtigungen statt Einzeltermine sparen Zeit')
      g.push('- Energieausweis bei jeder Besichtigung dabei haben')
      break

    default:
      g.push(`Station ${stationNum} im Geführten Wizard.`)
  }

  g.push('')
  g.push('DEIN VERHALTEN JETZT: Beantworte die direkte Frage. Weise dann proaktiv auf offene Punkte oder wichtige Tipps für DIESE Station hin. Konkret, direkt, ermutigend.')

  return g.join('\n')
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
