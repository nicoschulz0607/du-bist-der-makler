import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { ActivityEvent } from '@/lib/activity/types'
import { groupEventsByTimeRange, formatEventTime, getTimeRangeForDate, type GroupedEvents } from '@/lib/activity/timeline'
import { resolveEventDisplay, type EventDisplay } from '@/lib/activity/event-display'

interface ActivityTimelineProps {
  events: ActivityEvent[]
}

export default function ActivityTimeline({ events }: ActivityTimelineProps) {
  if (events.length === 0) return null

  const resolved = events
    .map(event => ({ event, display: resolveEventDisplay(event) }))
    .filter((r): r is { event: ActivityEvent; display: EventDisplay } => r.display !== null)

  if (resolved.length === 0) return null

  const grouped = groupEventsByTimeRange(resolved.map(r => r.event))
  const resolvedMap = new Map(resolved.map(r => [r.event.id, r.display]))

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
      <h2 className="text-[15px] font-semibold text-text-primary mb-4">
        Letzte Aktivitäten
      </h2>

      <div className="space-y-4">
        {grouped.map(group => (
          <TimelineGroup
            key={group.range}
            group={group}
            resolvedMap={resolvedMap}
          />
        ))}
      </div>
    </div>
  )
}

function TimelineGroup({
  group,
  resolvedMap,
}: {
  group: GroupedEvents
  resolvedMap: Map<string, EventDisplay>
}) {
  return (
    <div>
      <p className="text-[12px] font-medium text-text-secondary uppercase tracking-wide mb-2 pb-1 border-b border-gray-100">
        {group.label}
      </p>
      <div>
        {group.events.map(event => {
          const display = resolvedMap.get(event.id)
          if (!display) return null
          return (
            <TimelineEventItem key={event.id} event={event} display={display} />
          )
        })}
      </div>
    </div>
  )
}

function TimelineEventItem({
  event,
  display,
}: {
  event: ActivityEvent
  display: EventDisplay
}) {
  const Icon = display.icon
  const range = getTimeRangeForDate(event.created_at)
  const time = formatEventTime(event.created_at, range)
  const iconColorClass = display.iconColor === 'accent' ? 'text-[#1B6B45]' : 'text-gray-500'

  const inner = (
    <div className="flex items-start gap-3 py-2">
      <Icon size={18} strokeWidth={2} className={`flex-shrink-0 mt-0.5 ${iconColorClass}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-text-primary truncate">
          {display.titel}
        </p>
        {display.subtitel && (
          <p className="text-[12px] text-text-secondary truncate">{display.subtitel}</p>
        )}
      </div>
      <span className="text-[12px] text-text-secondary flex-shrink-0 mt-0.5">{time}</span>
      {display.link && <ChevronRight size={14} className="text-gray-400 flex-shrink-0 mt-1" />}
    </div>
  )

  if (display.link) {
    return (
      <Link
        href={display.link}
        className="block -mx-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
      >
        {inner}
      </Link>
    )
  }

  return <div className="-mx-2 px-2">{inner}</div>
}
