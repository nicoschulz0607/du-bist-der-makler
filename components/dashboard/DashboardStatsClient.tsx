'use client'

import StatCard from './StatCard'
import type { DashboardStatsData } from '@/lib/dashboard/stats'

interface Props {
  stats: DashboardStatsData
}

function getTageOnlineSubInfo(verbleibend: number | null): { text: string; severity: 'info' | 'hinweis' | 'wichtig' } | undefined {
  if (verbleibend === null) return undefined
  if (verbleibend > 60) return undefined
  if (verbleibend > 30) return { text: `noch ${verbleibend} Tage`, severity: 'info' }
  if (verbleibend > 7)  return { text: `noch ${verbleibend} Tage`, severity: 'hinweis' }
  return { text: `noch ${verbleibend} Tage — verlängern?`, severity: 'wichtig' }
}

function formatNaechsterTermin(termin: { datum: string; uhrzeit_von: string } | null): string {
  if (!termin) return 'keine geplant'

  const date = new Date(termin.datum)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  let datumLabel: string
  if (diffDays === 0)      datumLabel = 'heute'
  else if (diffDays === 1) datumLabel = 'morgen'
  else {
    const weekdayShort = date.toLocaleDateString('de-DE', { weekday: 'short' })
    const dayMonth = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.`
    datumLabel = `${weekdayShort}, ${dayMonth}`
  }

  const uhrzeit = termin.uhrzeit_von.slice(0, 5)
  return `nächster: ${datumLabel} ${uhrzeit}`
}

export default function DashboardStatsClient({ stats }: Props) {
  function scrollToPortalPerformance() {
    document.getElementById('portal-performance')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const tageOnlineSubInfo = getTageOnlineSubInfo(stats.tage_verbleibend)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Aufrufe (7 Tage)"
        value={stats.aufrufe_7tage_summe}
        subInfo={{ text: 'über alle Portale' }}
        onClick={scrollToPortalPerformance}
        showArrow
      />
      <StatCard
        label="Anfragen gesamt"
        value={stats.anfragen_gesamt}
        subInfo={{ text: 'alle ansehen' }}
        href="/dashboard/interessenten"
        showArrow
      />
      <StatCard
        label="Besichtigungen geplant"
        value={stats.besichtigungen_geplant}
        subInfo={{ text: formatNaechsterTermin(stats.naechster_termin) }}
        href="/dashboard/termine"
        showArrow
      />
      <StatCard
        label="Tage online"
        value={stats.tage_online !== null ? `${stats.tage_online} von 180` : '—'}
        subInfo={tageOnlineSubInfo}
      />
    </div>
  )
}
