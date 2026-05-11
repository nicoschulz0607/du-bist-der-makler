import { unstable_cache } from 'next/cache'

// Anthropic Workspace Admin API adapter.
// This is SEPARATE from the Claude API (ANTHROPIC_API_KEY).
// It reads workspace-level usage stats for cross-validation against ai_usage_log.
//
// Status: ADMIN.md "Offene Fragen" — Admin API Zugriff noch nicht freigeschaltet.
// Guard: returns null/empty when ANTHROPIC_ADMIN_KEY is absent.
//
// Required env var (add once access is granted):
//   ANTHROPIC_ADMIN_KEY  — Workspace Admin Key from console.anthropic.com
//
// NOTE: kosten.ts reads from ai_usage_log (Supabase), NOT from this adapter.
// This adapter is for cross-validation only: compare our tracked costs against
// Anthropic's official billing numbers to catch any tracking gaps.

const BASE = 'https://api.anthropic.com'

function isConfigured() {
  return !!process.env.ANTHROPIC_ADMIN_KEY
}

export interface AnthropicUsageZeitraum {
  inputTokens: number
  outputTokens: number
  estimatedCostUsd: number
}

export const fetchAnthropicTokenVerbrauch = unstable_cache(
  async (fromIso: string, toIso: string): Promise<AnthropicUsageZeitraum | null> => {
    if (!isConfigured()) return null

    try {
      const url = new URL(`${BASE}/v1/usage`)
      url.searchParams.set('start_time', fromIso)
      url.searchParams.set('end_time', toIso)

      const res = await fetch(url.toString(), {
        headers: {
          'x-api-key': process.env.ANTHROPIC_ADMIN_KEY!,
          'anthropic-version': '2023-06-01',
        },
      })

      if (!res.ok) return null

      const json = await res.json()

      return {
        inputTokens:      json.input_tokens       ?? 0,
        outputTokens:     json.output_tokens      ?? 0,
        estimatedCostUsd: json.estimated_cost_usd ?? 0,
      }
    } catch {
      return null
    }
  },
  ['helios-anthropic-usage'],
  { revalidate: 3600 }   // 1h
)
