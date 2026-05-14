// Single source of truth for all AI provider pricing.
// Update this file when prices change — nowhere else.

// MVP: hardcoded conversion rate.
// Replace with ECB API (e.g. api.frankfurter.app) in a later sprint.
export const USD_TO_EUR_RATE = 0.92  // EUR per USD, May 2026

// ── Anthropic ────────────────────────────────────────────────────────────────

interface AnthropicModelPricing {
  input_per_1m: number
  output_per_1m: number
  cache_read_per_1m: number
  cache_write_5min_per_1m: number
  cache_write_1h_per_1m: number
}

// Prices in USD per 1M tokens (Source: anthropic.com/pricing, May 2026)
export const ANTHROPIC_PRICING: Record<string, AnthropicModelPricing> = {
  'claude-sonnet-4-6': {
    input_per_1m: 3.00,
    output_per_1m: 15.00,
    cache_read_per_1m: 0.30,
    cache_write_5min_per_1m: 3.75,
    cache_write_1h_per_1m: 6.00,
  },
  'claude-haiku-4-5-20251001': {
    input_per_1m: 1.00,
    output_per_1m: 5.00,
    cache_read_per_1m: 0.10,
    cache_write_5min_per_1m: 1.25,
    cache_write_1h_per_1m: 2.00,
  },
  'claude-opus-4-7': {
    input_per_1m: 5.00,
    output_per_1m: 25.00,
    cache_read_per_1m: 0.50,
    cache_write_5min_per_1m: 6.25,
    cache_write_1h_per_1m: 10.00,
  },
}

export function calcAnthropicCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number | null {
  const p = ANTHROPIC_PRICING[model]
  if (!p) return null
  return (inputTokens / 1_000_000) * p.input_per_1m
    + (outputTokens / 1_000_000) * p.output_per_1m
}

// ── Replicate ────────────────────────────────────────────────────────────────

// USD per second (Source: replicate.com/pricing, May 2026)
export const REPLICATE_HARDWARE_RATES: Record<string, number> = {
  'cpu':       0.000100,
  't4':        0.000225,
  'a40':       0.000575,
  'a100-80gb': 0.001400,
  'h100':      0.001525,
}

export function calcReplicateCost(
  hardware: string,
  predictTimeSec: number
): number | null {
  const rate = REPLICATE_HARDWARE_RATES[hardware]
  if (!rate) return null
  return rate * predictTimeSec
}

// ── fal.ai ───────────────────────────────────────────────────────────────────

// Specific model pricing not publicly listed by fal.ai (May 2026).
// cost_usd will be null for fal rows until pricing becomes available.
export const FAL_PRICING: Record<string, { cost_per_prediction_usd: number | null }> = {
  // TODO Sprint 3a-Followup: fill in actual prices once confirmed with fal.ai
  'fal-ai/clarity-upscaler': { cost_per_prediction_usd: null },
  'fal-ai/interior-ai':      { cost_per_prediction_usd: null },
  'fal-ai/sky-replacement':  { cost_per_prediction_usd: null },
}

export function calcFalCost(model: string): number | null {
  return FAL_PRICING[model]?.cost_per_prediction_usd ?? null
}
