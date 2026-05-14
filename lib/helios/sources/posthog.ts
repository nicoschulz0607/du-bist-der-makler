import { unstable_cache } from 'next/cache'

// PostHog EU REST API adapter.
// NOTE: lib/analytics/track.ts → trackWeb() is currently a stub (empty body).
// All functions return empty/zero data until the PostHog JS SDK is wired up
// and frontend events start flowing. No code changes needed here once tracking
// is active — the API calls will return real data automatically.
//
// Required env vars (add to .env.local + Vercel):
//   POSTHOG_PERSONAL_API_KEY  — Workspace Personal API Key (not the project key)
//   POSTHOG_PROJECT_ID        — Numeric project ID from PostHog project settings

const BASE = 'https://eu.posthog.com'

function headers() {
  return {
    Authorization: `Bearer ${process.env.POSTHOG_PERSONAL_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

function projectId() {
  return process.env.POSTHOG_PROJECT_ID ?? ''
}

function isConfigured() {
  return !!(process.env.POSTHOG_PERSONAL_API_KEY && process.env.POSTHOG_PROJECT_ID)
}

export interface FunnelStep {
  name: string
  count: number
  conversionFromFirst: number   // 0–1
  conversionFromPrev: number    // 0–1
}

export interface FunnelResult {
  steps: FunnelStep[]
  overallConversion: number     // 0–1
}

// Landing → Registrierung → Kauf
// Event names must match trackWeb() calls once SDK is active.
export const fetchFunnel = unstable_cache(
  async (tage = 30): Promise<FunnelResult> => {
    if (!isConfigured()) {
      return { steps: [], overallConversion: 0 }
    }

    const dateBefore = new Date().toISOString()
    const dateFrom = new Date(Date.now() - tage * 86400_000).toISOString()

    try {
      const res = await fetch(
        `${BASE}/api/projects/${projectId()}/insights/funnel/`,
        {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({
            insight: 'FUNNELS',
            date_from: dateFrom,
            date_to: dateBefore,
            events: [
              { id: 'landing_viewed', order: 0 },
              { id: '$pageview', order: 1, properties: [{ key: '$pathname', operator: 'icontains', value: 'registrieren' }] },
              { id: 'checkout_abgeschlossen', order: 2 },
            ],
            funnel_window_days: 7,
          }),
        }
      )

      if (!res.ok) return { steps: [], overallConversion: 0 }

      const json = await res.json()
      const raw: Array<{ name: string; count: number }> = json.result?.[0] ?? []

      const steps: FunnelStep[] = raw.map((step, i) => ({
        name: step.name,
        count: step.count,
        conversionFromFirst: raw[0].count > 0 ? step.count / raw[0].count : 0,
        conversionFromPrev:  i === 0 ? 1 : (raw[i - 1].count > 0 ? step.count / raw[i - 1].count : 0),
      }))

      const overallConversion =
        steps.length >= 2 && steps[0].count > 0
          ? steps[steps.length - 1].count / steps[0].count
          : 0

      return { steps, overallConversion }
    } catch {
      return { steps: [], overallConversion: 0 }
    }
  },
  ['helios-posthog-funnel'],
  { revalidate: 900 }   // 15 min
)

export interface UtmQuelle {
  quelle: string
  besucher: number
  conversions: number
}

export const fetchTopUtmQuellen = unstable_cache(
  async (tage = 30): Promise<UtmQuelle[]> => {
    if (!isConfigured()) return []

    const dateFrom = new Date(Date.now() - tage * 86400_000).toISOString()

    try {
      const res = await fetch(
        `${BASE}/api/projects/${projectId()}/insights/trend/`,
        {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({
            insight: 'TRENDS',
            date_from: dateFrom,
            events: [{ id: 'landing_viewed', order: 0 }],
            breakdown: 'utm_source',
            breakdown_type: 'event',
          }),
        }
      )

      if (!res.ok) return []

      const json = await res.json()
      const results: Array<{ breakdown_value: string; aggregated_value: number }> =
        json.result ?? []

      return results
        .filter((r) => r.breakdown_value)
        .map((r) => ({
          quelle: r.breakdown_value,
          besucher: r.aggregated_value,
          conversions: 0,   // Requires cross-referencing with business_events — Sprint 3c
        }))
        .sort((a, b) => b.besucher - a.besucher)
        .slice(0, 10)
    } catch {
      return []
    }
  },
  ['helios-posthog-utm'],
  { revalidate: 900 }   // 15 min
)
