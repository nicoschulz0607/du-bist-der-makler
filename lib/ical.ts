function formatIcalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeIcal(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export interface IcalEventParams {
  uid: string
  sequence: number
  method: 'REQUEST' | 'CANCEL'
  dtstart: Date
  dtend: Date
  summary: string
  description: string
  location: string
  organizerName: string
  organizerEmail: string
  attendeeName: string
  attendeeEmail: string
}

export function buildIcal(params: IcalEventParams): string {
  const dtstamp = formatIcalDate(new Date())
  const dtstart = formatIcalDate(params.dtstart)
  const dtend = formatIcalDate(params.dtend)

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//du-bist-der-makler.de//CRM//DE',
    `METHOD:${params.method}`,
    'BEGIN:VEVENT',
    `UID:${params.uid}@du-bist-der-makler.de`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SEQUENCE:${params.sequence}`,
    `SUMMARY:${escapeIcal(params.summary)}`,
    `DESCRIPTION:${escapeIcal(params.description)}`,
    `LOCATION:${escapeIcal(params.location)}`,
    `ORGANIZER;CN="${escapeIcal(params.organizerName)}":mailto:${params.organizerEmail}`,
    `ATTENDEE;CN="${escapeIcal(params.attendeeName)}";RSVP=FALSE:mailto:${params.attendeeEmail}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.join('\r\n')
}

export function buildAppointmentDatetime(datum: string, uhrzeit: string): Date {
  return new Date(`${datum}T${uhrzeit}:00`)
}
