import { WIZARD_STATIONS } from '@/lib/wizard/config'
import type { KlaraContext } from './context'

export interface WizardHint {
  stationTitel: string
  fokus: string
  status_lines: string[]
  warmer_tipp?: string
  bei_nachfrage?: string
}

const STANDARD_FOOTER = `DEIN VERHALTEN HIER: Reagiere knapp und warm. Antworte erst auf die direkte \
Frage. Tipps nur wenn passend. Details (Zahlen, Paragraphen, Studienangaben) \
nur auf konkrete Nachfrage des Nutzers.`

export function getWizardHint(stationNum: number, ctx: KlaraContext): WizardHint | null {
  const stationConfig = WIZARD_STATIONS.find((s) => s.stationNum === stationNum)
  if (!stationConfig) return null

  const listing = ctx.listing

  switch (stationNum) {
    case 1: {
      const status_lines: string[] = []
      if (!listing) {
        status_lines.push('Noch kein Objekt angelegt — das passiert gleich hier.')
      } else {
        if (!listing.adresse_plz && !listing.adresse_ort) status_lines.push('Fehlt noch: Adresse')
        if (!listing.wohnflaeche_qm) status_lines.push('Fehlt noch: Wohnfläche')
        if (!listing.zimmer) status_lines.push('Fehlt noch: Zimmeranzahl')
        if (!listing.objekttyp) status_lines.push('Fehlt noch: Objekttyp')
        if (status_lines.length === 0) status_lines.push('Alle Pflichtfelder ausgefüllt.')
      }
      return {
        stationTitel: stationConfig.title,
        fokus: 'Adresse, Wohnfläche und Zimmeranzahl sind die Basis für alles weitere — auch für die Preisschätzung.',
        status_lines,
        warmer_tipp: 'Auf Wunsch kann die Straße im Inserat ausgeblendet werden — nur PLZ und Ort. Viele Verkäufer machen das aus Privatsphäre-Gründen.',
      }
    }

    case 2: {
      const status_lines: string[] = []
      if (listing?.preis) {
        status_lines.push(`Preis gesetzt: ${listing.preis.toLocaleString('de-DE')} €`)
      } else {
        status_lines.push('Preis noch nicht festgelegt.')
      }
      return {
        stationTitel: stationConfig.title,
        fokus: 'Wir analysieren jetzt Marktwert und Lage deiner Immobilie.',
        status_lines,
        warmer_tipp: 'Ein guter Startpreis macht den Unterschied. Mit Markt-Oberkante starten und nach 3–4 Wochen anpassen ist eine gängige Strategie.',
        bei_nachfrage: 'Ein zu hoher Startpreis kann ein Stigma erzeugen — Inserate die lange stehen wecken Misstrauen. Besser etwas Spielraum einkalkulieren.',
      }
    }

    case 3: {
      const status_lines: string[] = []
      if (listing?.energieausweis_status) {
        status_lines.push(`Energieausweis: ${listing.energieausweis_status}`)
      } else {
        status_lines.push('Energieausweis noch nicht angegeben.')
      }
      return {
        stationTitel: stationConfig.title,
        fokus: 'Der Energieausweis ist Pflicht beim Verkauf — der Käufer braucht ihn spätestens beim ersten Besichtigungstermin.',
        status_lines,
        warmer_tipp: 'Wenn du noch keinen hast: Online-Bestellung dauert 2–3 Werktage und kostet zwischen 50 und 150 Euro.',
        bei_nachfrage: 'Es gibt zwei Arten: Verbrauchsausweis (günstiger, reicht meist) und Bedarfsausweis (für Gebäude vor 1977 oder bestimmte Wohnformen). Ich kann dir das auf Nachfrage erklären.',
      }
    }

    case 4: {
      const fotoCount = listing?.foto_anzahl ?? 0
      const status_lines: string[] = []
      if (fotoCount === 0) {
        status_lines.push('Noch keine Fotos hochgeladen.')
      } else if (fotoCount < 5) {
        status_lines.push(`${fotoCount} Foto${fotoCount === 1 ? '' : 's'} hochgeladen — schon ein Anfang.`)
      } else if (fotoCount < 8) {
        status_lines.push(`${fotoCount} Fotos — schon gut.`)
      } else {
        status_lines.push(`${fotoCount} Fotos — sehr gut!`)
      }
      return {
        stationTitel: stationConfig.title,
        fokus: 'Fotos entscheiden mit, wer dein Inserat anschaut.',
        status_lines,
        warmer_tipp: 'Tageslicht hilft. Räume vorher kurz aufräumen. Querformat passt besser zu den meisten Plattformen.',
        bei_nachfrage: 'Die wichtigsten Räume: Wohnzimmer, Küche, Bad, Schlafzimmer, Außenansicht. 5–8 Fotos helfen Interessenten, sich ein Bild zu machen.',
      }
    }

    case 5: {
      const status_lines = [
        listing?.hat_grundriss ? 'Grundriss hochgeladen.' : 'Noch kein Grundriss vorhanden.',
      ]
      return {
        stationTitel: stationConfig.title,
        fokus: 'Ein Grundriss ist optional, aber viele Interessenten suchen genau danach.',
        status_lines,
        warmer_tipp: 'Wenn du keinen hast: eine handgezeichnete Skizze mit Maßen funktioniert auch. Oder kostenlose Online-Tools wie Floorplanner.',
      }
    }

    case 6: {
      return {
        stationTitel: stationConfig.title,
        fokus: 'Was deine Immobilie besonders macht — gerne ankreuzen was zutrifft.',
        status_lines: [],
        warmer_tipp: 'Sei ehrlich, nicht übertreibend. Käufer merken den Unterschied bei der Besichtigung.',
        bei_nachfrage: 'Beim Beschreiben besser nicht auf Familien, Religion oder Alter Bezug nehmen — auch wenn es nett gemeint ist. Das gilt für alle Inserate in Deutschland.',
      }
    }

    case 7: {
      const status_lines = [
        listing?.hat_expose ? 'Inserat-Texte bereits generiert.' : 'Texte werden gleich von der KI generiert.',
      ]
      return {
        stationTitel: stationConfig.title,
        fokus: 'Die KI schreibt einen Entwurf — du polierst ihn nach deinem Gefühl.',
        status_lines,
        warmer_tipp: 'Du kannst nach der Generierung alles noch anpassen. Deine Sprache, dein Inserat.',
      }
    }

    case 8: {
      const status_lines: string[] = []
      if (ctx.user.vorname) {
        status_lines.push(`Name: ${ctx.user.vorname} ✓`)
      } else {
        status_lines.push('Vorname noch nicht gesetzt.')
      }
      return {
        stationTitel: stationConfig.title,
        fokus: 'Diese Daten siehst nur du — und sie erscheinen für Interessenten auf deinem Inserat.',
        status_lines,
        warmer_tipp: 'Eine Mobilnummer reicht völlig. Persönliche Adresse muss nicht ins Inserat.',
      }
    }

    case 9: {
      const status_lines: string[] = []
      if (!listing) {
        status_lines.push('Noch kein Objekt erfasst.')
      } else {
        if (!listing.preis) status_lines.push('Noch offen: Preis fehlt.')
        if (!listing.wohnflaeche_qm) status_lines.push('Noch offen: Wohnfläche fehlt.')
        if (listing.foto_anzahl === 0) status_lines.push('Noch offen: Mindestens 1 Foto nötig.')
        if (!listing.hat_expose) status_lines.push('Noch offen: Inserat-Texte fehlen.')
        if (listing.energieausweis_status === 'nachzureichen') {
          status_lines.push('Energieausweis wird nachgereicht — bitte beim Besichtigungstermin dabeihaben.')
        }
        if (status_lines.length === 0) status_lines.push('Alles bereit — du kannst jetzt live gehen!')
      }
      return {
        stationTitel: stationConfig.title,
        fokus: 'Letzter Blick auf alles — dann kann\'s losgehen.',
        status_lines,
        warmer_tipp: 'Erste Anfragen kommen typischerweise innerhalb von ein bis drei Tagen. Schnell antworten erhöht deine Chancen.',
      }
    }

    default:
      return null
  }
}

export function formatHintAsText(stationNum: number, hint: WizardHint): string {
  const lines: string[] = []
  lines.push(`## WIZARD: Station ${stationNum} — ${hint.stationTitel}`)
  lines.push('')
  lines.push(hint.fokus)

  if (hint.status_lines.length > 0) {
    lines.push('')
    lines.push(hint.status_lines.join(' · '))
  }

  if (hint.warmer_tipp) {
    lines.push('')
    lines.push(hint.warmer_tipp)
  }

  lines.push('')
  lines.push(STANDARD_FOOTER)

  return lines.join('\n')
}
