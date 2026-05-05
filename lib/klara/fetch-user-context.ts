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
      id, objekttyp, adresse_plz, adresse_ort, wohnflaeche_qm, zimmer,
      baujahr, preis, energieausweis_klasse, status, fotos, created_at
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
  lines.push(`Kontext-Origin (woher die Frage kommt): „${contextOrigin}"`)

  return lines.join('\n')
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
