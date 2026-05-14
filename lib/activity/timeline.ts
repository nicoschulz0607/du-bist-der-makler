import type { ActivityEvent } from './types'

export type TimeRange = 'heute' | 'gestern' | 'diese_woche' | 'frueher'

export interface GroupedEvents {
  range: TimeRange
  label: string
  events: ActivityEvent[]
}

const RANGE_ORDER: TimeRange[] = ['heute', 'gestern', 'diese_woche', 'frueher']

const RANGE_LABELS: Record<TimeRange, string> = {
  heute: 'Heute',
  gestern: 'Gestern',
  diese_woche: 'Diese Woche',
  frueher: 'Früher',
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function getTimeRangeForDate(dateIso: string, now: Date = new Date()): TimeRange {
  const date = new Date(dateIso)

  if (sameDay(date, now)) return 'heute'

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(date, yesterday)) return 'gestern'

  // 2–7 Tage vor today (Day-boundary, nicht ms)
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((nowMidnight.getTime() - dateMidnight.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays >= 2 && diffDays <= 7) return 'diese_woche'
  return 'frueher'
}

export function formatEventTime(dateIso: string, range: TimeRange): string {
  const date = new Date(dateIso)
  const pad = (n: number) => String(n).padStart(2, '0')

  if (range === 'heute') {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  if (range === 'gestern') {
    return `Gestern ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const WEEKDAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  const wday = WEEKDAY_SHORT[date.getDay()]
  const day = pad(date.getDate())
  const month = pad(date.getMonth() + 1)

  if (range === 'diese_woche') {
    return `${wday}, ${day}.${month}.`
  }

  // frueher: "13.05.26"
  const year = String(date.getFullYear()).slice(2)
  return `${day}.${month}.${year}`
}

export function groupEventsByTimeRange(events: ActivityEvent[]): GroupedEvents[] {
  const buckets = new Map<TimeRange, ActivityEvent[]>()

  for (const event of events) {
    const range = getTimeRangeForDate(event.created_at)
    if (!buckets.has(range)) buckets.set(range, [])
    buckets.get(range)!.push(event)
  }

  return RANGE_ORDER
    .filter(range => buckets.has(range))
    .map(range => ({
      range,
      label: RANGE_LABELS[range],
      events: buckets.get(range)!,
    }))
}
