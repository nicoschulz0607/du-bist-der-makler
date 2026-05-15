import {
  MessageCircle,
  UserCheck,
  Calendar,
  FileCheck2,
  Send,
  Eye,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react'
import type { ActivityEvent } from './types'
import { EVENT_TYPES } from './types'

export type EventIconColor = 'gray' | 'accent'

export interface EventDisplay {
  icon: LucideIcon
  iconColor: EventIconColor
  titel: string
  subtitel?: string
  link?: string
}

export function resolveEventDisplay(event: ActivityEvent): EventDisplay | null {
  switch (event.event_type) {
    case EVENT_TYPES.INTERESSENT_ANGELEGT: {
      const name = (event.payload?.name as string) ?? null
      const quelle = (event.payload?.quelle as string) ?? null
      return {
        icon: MessageCircle,
        iconColor: 'accent',
        titel: name ? `${name} hat sich gemeldet` : 'Neue Anfrage eingegangen',
        subtitel: quelle ? `über ${formatQuelle(quelle)}` : undefined,
        link: event.interessent_id ? `/dashboard/interessenten/${event.interessent_id}` : undefined,
      }
    }

    case EVENT_TYPES.INTERESSENT_STATUS_GEAENDERT: {
      const name = (event.payload?.name as string) ?? null
      const nach = (event.payload?.nach as string) ?? null
      if (!nach) return null
      return {
        icon: UserCheck,
        iconColor: 'gray',
        titel: name
          ? `${name}: Status auf ${formatStatus(nach)}`
          : `Interessent: Status auf ${formatStatus(nach)}`,
        link: event.interessent_id ? `/dashboard/interessenten/${event.interessent_id}` : undefined,
      }
    }

    case EVENT_TYPES.TERMIN_GEPLANT: {
      const datum = (event.payload?.datum as string) ?? null
      const uhrzeit = (event.payload?.uhrzeit as string) ?? null
      const anzahl = (event.payload?.anzahl_interessenten as number) ?? null
      if (!datum) return null
      const datumFormatted = formatDateGerman(datum)
      const teilnehmer = anzahl && anzahl > 1 ? `, ${anzahl} Teilnehmer` : ''
      return {
        icon: Calendar,
        iconColor: 'gray',
        titel: 'Termin geplant',
        subtitel: `${datumFormatted}${uhrzeit ? ` um ${uhrzeit}` : ''}${teilnehmer}`,
        link: '/dashboard/termine',
      }
    }

    case EVENT_TYPES.DOKUMENT_HOCHGELADEN: {
      const typ = (event.payload?.dokument_typ as string) ?? null
      return {
        icon: FileCheck2,
        iconColor: 'gray',
        titel: typ ? `${formatDokumentTyp(typ)} hochgeladen` : 'Dokument hochgeladen',
        link: '/dashboard/unterlagen',
      }
    }

    case EVENT_TYPES.MAPPE_GETEILT: {
      const empfaengerName = (event.payload?.empfaenger_name as string) ?? null
      const anzahlDok = (event.payload?.anzahl_dokumente as number) ?? null
      const gueltTage = (event.payload?.gueltigkeit_tage as number) ?? null
      const subParts: string[] = []
      if (anzahlDok) subParts.push(`${anzahlDok} Dokument${anzahlDok === 1 ? '' : 'e'}`)
      if (gueltTage) subParts.push(`${gueltTage} Tage gültig`)
      return {
        icon: Send,
        iconColor: 'gray',
        titel: empfaengerName ? `Mappe an ${empfaengerName} geteilt` : 'Mappe geteilt',
        subtitel: subParts.length > 0 ? subParts.join(' · ') : undefined,
        link: '/dashboard/unterlagen',
      }
    }

    case EVENT_TYPES.MAPPE_ABGERUFEN: {
      const empfaengerName = (event.payload?.empfaenger_name as string) ?? null
      return {
        icon: Eye,
        iconColor: 'accent',
        titel: empfaengerName
          ? `${empfaengerName} hat die Mappe geöffnet`
          : 'Mappe wurde geöffnet',
        link: '/dashboard/unterlagen',
      }
    }

    case EVENT_TYPES.LISTING_VEROEFFENTLICHT: {
      return {
        icon: CheckCircle2,
        iconColor: 'accent',
        titel: 'Inserat veröffentlicht',
        link: '/dashboard/objekt',
      }
    }

    case EVENT_TYPES.INTERESSENT_BEANTWORTET: {
      const name = (event.payload?.name as string) ?? null
      return {
        icon: CheckCircle2,
        iconColor: 'accent',
        titel: name ? `Anfrage beantwortet: ${name}` : 'Anfrage beantwortet',
        link: event.interessent_id
          ? `/dashboard/interessenten/${event.interessent_id}`
          : undefined,
      }
    }

    case EVENT_TYPES.WIZARD_STATION_COMPLETED:
    case EVENT_TYPES.WIZARD_STATION_SKIPPED:
      return null

    default:
      return null
  }
}

function formatQuelle(quelle: string): string {
  const map: Record<string, string> = {
    immoscout: 'ImmoScout24',
    immowelt: 'ImmoWelt',
    ebay: 'eBay Kleinanzeigen',
    manuell: 'manuelle Eingabe',
    dubistdermakler: 'du-bist-der-makler.de',
  }
  return map[quelle.toLowerCase()] ?? quelle
}

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatDokumentTyp(typ: string): string {
  const map: Record<string, string> = {
    energieausweis: 'Energieausweis',
    grundbuchauszug: 'Grundbuchauszug',
    flurkarte: 'Flurkarte',
    personalausweis: 'Personalausweis',
    teilungserklaerung: 'Teilungserklärung',
    grundriss: 'Grundriss',
    lageplan: 'Lageplan',
  }
  return map[typ.toLowerCase()] ?? typ.charAt(0).toUpperCase() + typ.slice(1)
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

    const WEEKDAY = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
    const wday = WEEKDAY[date.getDay()]
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')

    return `${wday}, ${day}.${month}.`
  } catch {
    return isoDate
  }
}
