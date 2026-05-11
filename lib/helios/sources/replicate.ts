import { unstable_cache } from 'next/cache'

// Replicate API adapter — reads prediction history for cost cross-validation.
//
// Status: ADMIN.md "Offene Fragen" — REPLICATE_API_TOKEN für Usage-Stats offen.
// Guard: returns null/empty when REPLICATE_API_TOKEN is absent.
//
// NOTE: kosten.ts reads from ai_usage_log (Supabase), NOT from this adapter.
// This adapter is for cross-validation only.

const BASE = 'https://api.replicate.com'

function isConfigured() {
  return !!process.env.REPLICATE_API_TOKEN
}

export interface ReplicatePrediction {
  id: string
  model: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  predictTimeSec: number | null
  createdAt: string
}

export interface ReplicateKostenZeitraum {
  predictions: number
  gesamtLaufzeitSec: number
  // Cost cannot be computed here without hardware info per prediction.
  // ai_usage_log tracks cost at call-time via calcReplicateCost — use that for billing.
}

export const fetchReplicatePredictions = unstable_cache(
  async (tage = 30): Promise<ReplicatePrediction[]> => {
    if (!isConfigured()) return []

    const cutoff = new Date(Date.now() - tage * 86400_000)
    const predictions: ReplicatePrediction[] = []

    try {
      let cursor: string | null = null

      outer: while (true) {
        const url: string = cursor
          ? `${BASE}/v1/predictions?cursor=${cursor}`
          : `${BASE}/v1/predictions`

        const res: Response = await fetch(url, {
          headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` },
        })

        if (!res.ok) break

        const json: { results?: unknown[]; next?: string } = await res.json()
        const results = (json.results ?? []) as Array<{
          id: string
          version: string | null
          status: string
          metrics?: { predict_time?: number }
          created_at: string
        }>

        for (const p of results) {
          if (new Date(p.created_at) < cutoff) break outer

          predictions.push({
            id: p.id,
            model: p.version ?? 'unknown',
            status: p.status as ReplicatePrediction['status'],
            predictTimeSec: p.metrics?.predict_time ?? null,
            createdAt: p.created_at,
          })
        }

        cursor = json.next ? new URL(json.next).searchParams.get('cursor') : null
        if (!cursor) break
      }
    } catch {
      return []
    }

    return predictions
  },
  ['helios-replicate-predictions'],
  { revalidate: 3600 }   // 1h
)

export const fetchReplicateKostenZeitraum = unstable_cache(
  async (tage = 30): Promise<ReplicateKostenZeitraum | null> => {
    if (!isConfigured()) return null

    const predictions = await fetchReplicatePredictions(tage)
    const succeeded = predictions.filter((p) => p.status === 'succeeded')

    return {
      predictions: succeeded.length,
      gesamtLaufzeitSec: succeeded.reduce((sum, p) => sum + (p.predictTimeSec ?? 0), 0),
    }
  },
  ['helios-replicate-kosten'],
  { revalidate: 3600 }   // 1h
)
