import type { KlaraContext } from './context'

export type TriggerSchwere = 'info' | 'hinweis' | 'wichtig'

export type TriggerCategory =
  | 'anfrage'
  | 'termin'
  | 'listing'
  | 'wizard'
  | 'unterlagen'
  | 'paket'
  | 'aktivitaet'

export interface TriggerSignal {
  signal_typ: string
  schwere: TriggerSchwere
  category: TriggerCategory
  titel: string
  beschreibung: string
  empfohlene_aktion: string
  link_ziel?: string
  bezug?: {
    interessent_id?: string
    termin_id?: string
    listing_id?: string
  }
  klara_einstieg?: string
  prioritaet: number
}

function formatDateGerman(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    if (isNaN(date.getTime())) return isoDate

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()

    if (sameDay(date, today)) return 'heute'
    if (sameDay(date, tomorrow)) return 'morgen'

    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
    const wochentag = weekdays[date.getDay()]
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')

    return `${wochentag}, ${day}.${month}.`
  } catch {
    return isoDate
  }
}

function checkAnfrageSignals(ctx: KlaraContext): TriggerSignal[] {
  const signals: TriggerSignal[] = []

  // Trigger 1.1 — anfrage_unbeantwortet_24h
  const anfrage = ctx.interessenten.aelteste_unbeantwortete_anfrage
  if (anfrage) {
    const stunden = anfrage.wartet_seit_stunden
    if (stunden >= 24) {
      const istWichtig = stunden >= 48
      const tage = Math.floor(stunden / 24)
      const dauerText = tage >= 1 ? `${tage} Tag${tage > 1 ? 'en' : ''}` : `${Math.floor(stunden)} Stunden`

      signals.push({
        signal_typ: 'anfrage_unbeantwortet_24h',
        schwere: istWichtig ? 'wichtig' : 'hinweis',
        category: 'anfrage',
        titel: `${anfrage.name} wartet auf Antwort`,
        beschreibung: `Anfrage liegt seit ${dauerText} offen.`,
        empfohlene_aktion: 'Antwort verfassen',
        link_ziel: `/dashboard/interessenten/${anfrage.interessent_id}`,
        bezug: { interessent_id: anfrage.interessent_id },
        klara_einstieg: `${anfrage.name} wartet seit ${dauerText} auf eine Antwort von dir.`,
        prioritaet: istWichtig ? 90 : 70,
      })
    }
  }

  // Trigger 1.2 — viele_neue_anfragen
  const neueAnzahl = ctx.interessenten.nach_status['neu'] ?? 0
  if (neueAnzahl >= 3) {
    signals.push({
      signal_typ: 'viele_neue_anfragen',
      schwere: 'hinweis',
      category: 'anfrage',
      titel: 'Mehrere neue Anfragen',
      beschreibung: `${neueAnzahl} Interessenten warten auf erste Reaktion.`,
      empfohlene_aktion: 'Anfragen sichten',
      link_ziel: '/dashboard/interessenten',
      klara_einstieg: `Du hast ${neueAnzahl} frische Anfragen. Sollen wir sie zusammen durchgehen?`,
      prioritaet: 65,
    })
  }

  return signals
}

function checkTerminSignals(ctx: KlaraContext): TriggerSignal[] {
  const signals: TriggerSignal[] = []
  const stundenBis = ctx.termine.naechster_in_stunden
  const naechster = ctx.termine.naechste[0]

  if (stundenBis === null || !naechster) return signals

  // Trigger 2.2 — termin_naehert_sich_2h (Prio: deckt < 2h ab)
  if (stundenBis >= 0 && stundenBis < 2) {
    const minutenBis = Math.max(0, Math.round(stundenBis * 60))
    signals.push({
      signal_typ: 'termin_naehert_sich_2h',
      schwere: 'wichtig',
      category: 'termin',
      titel: minutenBis < 60 ? `Termin in ${minutenBis} Minuten` : `Termin in ca. ${Math.round(stundenBis)}h`,
      beschreibung: `Mit ${naechster.anzahl_interessenten} Interessent${naechster.anzahl_interessenten === 1 ? '' : 'en'}.`,
      empfohlene_aktion: 'Letzte Vorbereitung',
      link_ziel: '/dashboard/termine',
      bezug: { termin_id: naechster.id },
      klara_einstieg: `Gleich ist Termin. Brauchst du noch was?`,
      prioritaet: 95,
    })
    return signals
  }

  // Trigger 2.1 — termin_naehert_sich_24h (2h bis 24h)
  if (stundenBis >= 2 && stundenBis <= 24) {
    signals.push({
      signal_typ: 'termin_naehert_sich_24h',
      schwere: 'hinweis',
      category: 'termin',
      titel: 'Termin steht bevor',
      beschreibung: `${formatDateGerman(naechster.datum)} um ${naechster.uhrzeit} Uhr — mit ${naechster.anzahl_interessenten} Interessent${naechster.anzahl_interessenten === 1 ? '' : 'en'}.`,
      empfohlene_aktion: 'Termin vorbereiten',
      link_ziel: '/dashboard/termine',
      bezug: { termin_id: naechster.id },
      klara_einstieg: `Bald ist Besichtigungstermin — willst du was vorbereiten?`,
      prioritaet: 80,
    })
  }

  return signals
}

function checkListingSignals(ctx: KlaraContext): TriggerSignal[] {
  if (!ctx.listing) return []

  const signals: TriggerSignal[] = []

  // Trigger 3.1 — listing_lange_ohne_anfrage
  if (
    ctx.listing.status === 'aktiv' &&
    ctx.listing.tage_seit_anlage >= 14 &&
    ctx.interessenten.gesamt === 0
  ) {
    signals.push({
      signal_typ: 'listing_lange_ohne_anfrage',
      schwere: 'hinweis',
      category: 'listing',
      titel: `Inserat seit ${ctx.listing.tage_seit_anlage} Tagen ohne Anfrage`,
      beschreibung: 'Vielleicht hilft eine Anpassung von Fotos oder Beschreibung.',
      empfohlene_aktion: 'Inserat überprüfen',
      link_ziel: '/dashboard/objekt',
      bezug: { listing_id: ctx.listing.id },
      klara_einstieg: `Dein Inserat ist seit ${ctx.listing.tage_seit_anlage} Tagen online, aber noch keine Anfragen. Lass uns schauen woran es liegen könnte.`,
      prioritaet: 60,
    })
  }

  // Trigger 3.2 — listing_wenige_fotos
  if (ctx.listing.status === 'aktiv' && ctx.listing.foto_anzahl < 5) {
    signals.push({
      signal_typ: 'listing_wenige_fotos',
      schwere: 'info',
      category: 'listing',
      titel: 'Wenige Fotos im Inserat',
      beschreibung: `${ctx.listing.foto_anzahl} Foto${ctx.listing.foto_anzahl === 1 ? '' : 's'} — 5 bis 8 wäre ideal.`,
      empfohlene_aktion: 'Fotos ergänzen',
      link_ziel: '/dashboard/objekt',
      bezug: { listing_id: ctx.listing.id },
      prioritaet: 40,
    })
  }

  return signals
}

function checkWizardSignals(ctx: KlaraContext): TriggerSignal[] {
  if (!ctx.wizard.aktuelle_station) return []
  if (ctx.listing?.status === 'aktiv') return []
  if (ctx.aktivitaet.tage_seit_letzter_aktivitaet === null) return []
  if (ctx.aktivitaet.tage_seit_letzter_aktivitaet < 3) return []

  const station = ctx.wizard.aktuelle_station
  const tage = ctx.aktivitaet.tage_seit_letzter_aktivitaet

  return [{
    signal_typ: 'wizard_steckengeblieben',
    schwere: 'hinweis',
    category: 'wizard',
    titel: 'Verkaufs-Vorbereitung pausiert',
    beschreibung: `Du bist seit ${tage} Tagen bei Schritt ${station} stehen geblieben.`,
    empfohlene_aktion: 'Weitermachen',
    link_ziel: '/dashboard/schritte',
    klara_einstieg: `Wir hatten Schritt ${station} angefangen. Wollen wir das fertig machen, oder hängst du gerade an etwas?`,
    prioritaet: 50,
  }]
}

function checkUnterlagenSignals(ctx: KlaraContext): TriggerSignal[] {
  if (!ctx.listing) return []
  if (ctx.listing.status !== 'aktiv') return []
  if (ctx.unterlagen.pflicht_gesamt === 0) return []
  if (ctx.unterlagen.pflicht_prozent >= 70) return []

  return [{
    signal_typ: 'unterlagen_unvollstaendig_aber_aktiv',
    schwere: 'info',
    category: 'unterlagen',
    titel: 'Wichtige Unterlagen fehlen noch',
    beschreibung: `${ctx.unterlagen.pflicht_vorhanden} von ${ctx.unterlagen.pflicht_gesamt} Pflichtdokumenten — fehlende werden spätestens beim Notar gebraucht.`,
    empfohlene_aktion: 'Unterlagen prüfen',
    link_ziel: '/dashboard/unterlagen',
    prioritaet: 45,
  }]
}

function checkPaketSignals(ctx: KlaraContext): TriggerSignal[] {
  const tage = ctx.user.paket_tage_verbleibend
  if (tage === null || tage <= 0) return []

  const signals: TriggerSignal[] = []

  // Trigger 6.2 — paket_laeuft_aus_7_tage (deckt 1–7 Tage ab)
  if (tage <= 7) {
    signals.push({
      signal_typ: 'paket_laeuft_aus_7_tage',
      schwere: 'hinweis',
      category: 'paket',
      titel: `Paket läuft in ${tage} Tagen aus`,
      beschreibung: 'Jetzt verlängern und Lücke vermeiden.',
      empfohlene_aktion: 'Verlängern',
      link_ziel: '/dashboard/einstellungen',
      prioritaet: 70,
    })
    return signals
  }

  // Trigger 6.1 — paket_laeuft_aus_30_tage (8–30 Tage)
  if (tage <= 30) {
    signals.push({
      signal_typ: 'paket_laeuft_aus_30_tage',
      schwere: 'info',
      category: 'paket',
      titel: `Paket läuft in ${tage} Tagen aus`,
      beschreibung: 'Falls du noch nicht verkauft hast, kannst du verlängern.',
      empfohlene_aktion: 'Verlängern',
      link_ziel: '/dashboard/einstellungen',
      prioritaet: 35,
    })
  }

  return signals
}

function checkAktivitaetSignals(ctx: KlaraContext): TriggerSignal[] {
  const tage = ctx.aktivitaet.tage_seit_letzter_aktivitaet
  if (tage === null || tage < 7) return []
  if (ctx.listing?.status !== 'aktiv') return []

  return [{
    signal_typ: 'lange_inaktiv',
    schwere: 'info',
    category: 'aktivitaet',
    titel: 'Lange nichts gehört',
    beschreibung: `Letzte Aktivität vor ${tage} Tagen.`,
    empfohlene_aktion: 'Stand checken',
    link_ziel: '/dashboard',
    klara_einstieg: `Eine Woche ist hier nicht viel passiert. Alles okay, oder kann ich dir bei was helfen?`,
    prioritaet: 30,
  }]
}

export function detectTriggerSignals(ctx: KlaraContext): TriggerSignal[] {
  const all: TriggerSignal[] = []

  try { all.push(...checkAnfrageSignals(ctx)) } catch (e) { console.error('triggers/anfrage', e) }
  try { all.push(...checkTerminSignals(ctx)) } catch (e) { console.error('triggers/termin', e) }
  try { all.push(...checkListingSignals(ctx)) } catch (e) { console.error('triggers/listing', e) }
  try { all.push(...checkWizardSignals(ctx)) } catch (e) { console.error('triggers/wizard', e) }
  try { all.push(...checkUnterlagenSignals(ctx)) } catch (e) { console.error('triggers/unterlagen', e) }
  try { all.push(...checkPaketSignals(ctx)) } catch (e) { console.error('triggers/paket', e) }
  try { all.push(...checkAktivitaetSignals(ctx)) } catch (e) { console.error('triggers/aktivitaet', e) }

  return all.sort((a, b) => b.prioritaet - a.prioritaet)
}

export function getPrimarySignal(ctx: KlaraContext): TriggerSignal | null {
  const all = detectTriggerSignals(ctx)
  const wichtig = all.find(s => s.schwere === 'wichtig')
  if (wichtig) return wichtig

  const hinweis = all.find(s => s.schwere === 'hinweis')
  if (hinweis) return hinweis

  return all[0] ?? null
}

export function getSignalsByCategory(
  ctx: KlaraContext,
  category: TriggerCategory
): TriggerSignal[] {
  return detectTriggerSignals(ctx).filter(s => s.category === category)
}
