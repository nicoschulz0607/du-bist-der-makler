import { unstable_cache } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { USD_TO_EUR_RATE } from '@/lib/ai/pricing'

export interface Zeitraum {
  von: string  // ISO datetime
  bis: string  // ISO datetime
}

export interface KostenProTag {
  datum: string        // YYYY-MM-DD
  kosten_cent: number  // EUR cents (cost_usd converted via USD_TO_EUR_RATE)
}

export interface KostenProUser {
  userId: string
  kosten_cent: number  // EUR cents
}

interface RawRow {
  provider: string
  call_site: string
  cost_usd: string | number | null
  user_id: string | null
  created_at: string
}

// USD → EUR-Cent: Konvertierung in der Aggregations-Schicht.
// ai_usage_log bleibt in USD (Provider-Daten unverändert) — nur hier wird konvertiert.
function usdZuEurCent(usd: number): number {
  return Math.round(usd * USD_TO_EUR_RATE * 100)
}

// Einmalig gecachte Rohdaten — alle Aggregationsfunktionen nutzen diesen Cache
const fetchAiUsageRows = (zeitraum: Zeitraum) =>
  unstable_cache(
    async (): Promise<RawRow[]> => {
      const service = createServiceClient()
      const { data } = await service
        .from('ai_usage_log')
        .select('provider, call_site, cost_usd, user_id, created_at')
        .gte('created_at', zeitraum.von)
        .lte('created_at', zeitraum.bis)
      return (data ?? []) as RawRow[]
    },
    ['helios-ai-usage-raw', zeitraum.von, zeitraum.bis],
    { revalidate: 600 }
  )()

export async function kostenProTag(zeitraum: Zeitraum): Promise<KostenProTag[]> {
  const rows = await fetchAiUsageRows(zeitraum)
  const byDay = new Map<string, number>()

  for (const row of rows) {
    const datum = row.created_at.slice(0, 10)
    const usd = parseFloat(String(row.cost_usd ?? 0))
    byDay.set(datum, (byDay.get(datum) ?? 0) + usd)
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([datum, usd]) => ({ datum, kosten_cent: usdZuEurCent(usd) }))
}

export async function kostenProProvider(
  zeitraum: Zeitraum
): Promise<{ anthropic: number; fal: number; replicate: number }> {
  const rows = await fetchAiUsageRows(zeitraum)
  const acc = { anthropic: 0, fal: 0, replicate: 0 }

  for (const row of rows) {
    const usd = parseFloat(String(row.cost_usd ?? 0))
    if (row.provider === 'anthropic' || row.provider === 'fal' || row.provider === 'replicate') {
      acc[row.provider] += usd
    }
  }

  return {
    anthropic: usdZuEurCent(acc.anthropic),
    fal:       usdZuEurCent(acc.fal),
    replicate: usdZuEurCent(acc.replicate),
  }
}

export async function kostenProCallSite(zeitraum: Zeitraum): Promise<Record<string, number>> {
  const rows = await fetchAiUsageRows(zeitraum)
  const bySite = new Map<string, number>()

  for (const row of rows) {
    const usd = parseFloat(String(row.cost_usd ?? 0))
    bySite.set(row.call_site, (bySite.get(row.call_site) ?? 0) + usd)
  }

  const result: Record<string, number> = {}
  Array.from(bySite.entries())
    .sort(([, a], [, b]) => b - a)
    .forEach(([site, usd]) => { result[site] = usdZuEurCent(usd) })

  return result
}

export async function gesamtKostenCent(zeitraum: Zeitraum): Promise<number> {
  const rows = await fetchAiUsageRows(zeitraum)
  const total = rows.reduce((sum, row) => sum + parseFloat(String(row.cost_usd ?? 0)), 0)
  return usdZuEurCent(total)
}

export async function kostenProUser(zeitraum: Zeitraum, limit = 20): Promise<KostenProUser[]> {
  const rows = await fetchAiUsageRows(zeitraum)
  const byUser = new Map<string, number>()

  for (const row of rows) {
    if (!row.user_id) continue
    const usd = parseFloat(String(row.cost_usd ?? 0))
    byUser.set(row.user_id, (byUser.get(row.user_id) ?? 0) + usd)
  }

  return Array.from(byUser.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([userId, usd]) => ({ userId, kosten_cent: usdZuEurCent(usd) }))
}

// Historisches Paket-Mapping: jeder Call wird dem Paket zugeordnet,
// das zum Zeitpunkt des Calls aktiv war (JOIN über start_datum/ende_datum).
// Edge-Case "kein Paket": Call ohne zugehöriges Paket → Gruppe 'kein_paket'.
// Sum of currently active fixed_costs without time-period scaling.
// Answers: "how much do we spend per month in fixed costs right now?"
export async function getMonatlicheBurnRate(): Promise<number> {
  const service = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await service
    .from('fixed_costs')
    .select('betrag_cent')
    .lte('gueltig_ab', today)
    .or(`gueltig_bis.is.null,gueltig_bis.gte.${today}`)

  return ((data ?? []) as Array<{ betrag_cent: number }>).reduce(
    (sum, fc) => sum + fc.betrag_cent,
    0
  )
}

export async function kostenNachTier(zeitraum: Zeitraum): Promise<Record<string, number>> {
  const rows = await fetchAiUsageRows(zeitraum)
  const userIds = [
    ...new Set(rows.map(r => r.user_id).filter((id): id is string => id !== null)),
  ]

  const paketeByUser = new Map<
    string,
    Array<{ tier: string | null; start_datum: string; ende_datum: string | null }>
  >()

  if (userIds.length > 0) {
    const service = createServiceClient()
    const { data: pakete } = await service
      .from('pakete')
      .select('user_id, tier, start_datum, ende_datum')
      .in('user_id', userIds)

    for (const p of pakete ?? []) {
      const list = paketeByUser.get(p.user_id) ?? []
      list.push({ tier: p.tier, start_datum: p.start_datum, ende_datum: p.ende_datum })
      paketeByUser.set(p.user_id, list)
    }
  }

  const byTier = new Map<string, number>()

  for (const row of rows) {
    const usd = parseFloat(String(row.cost_usd ?? 0))
    const rowDate = row.created_at.slice(0, 10)
    let tier = 'kein_paket'

    if (row.user_id) {
      const userPakete = paketeByUser.get(row.user_id) ?? []
      const match = userPakete.find(
        p => p.start_datum <= rowDate && (p.ende_datum == null || p.ende_datum >= rowDate)
      )
      if (match?.tier) tier = match.tier
    }

    byTier.set(tier, (byTier.get(tier) ?? 0) + usd)
  }

  const result: Record<string, number> = {}
  Array.from(byTier.entries())
    .sort(([, a], [, b]) => b - a)
    .forEach(([t, usd]) => { result[t] = usdZuEurCent(usd) })

  return result
}
