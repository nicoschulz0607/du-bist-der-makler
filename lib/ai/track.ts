import { createServiceClient } from '@/lib/supabase/service'
import { calcAnthropicCost, calcFalCost, calcReplicateCost } from './pricing'

export interface TrackAiParams {
  provider: 'anthropic' | 'fal' | 'replicate'
  model: string
  callSite: string
  inputTokens?: number
  outputTokens?: number
  // Optional override — use when cost is computed externally (e.g. Replicate predict_time)
  costUsd?: number | null
  userId?: string
  listingId?: string
}

export function trackAiCall(params: TrackAiParams): void {
  Promise.resolve().then(async () => {
    try {
      let costUsd: number | null

      if (params.costUsd !== undefined) {
        costUsd = params.costUsd
      } else if (params.provider === 'anthropic') {
        costUsd = calcAnthropicCost(
          params.model,
          params.inputTokens ?? 0,
          params.outputTokens ?? 0
        )
      } else if (params.provider === 'fal') {
        costUsd = calcFalCost(params.model)
      } else {
        costUsd = null
      }

      const service = createServiceClient()
      await service.from('ai_usage_log').insert({
        provider:      params.provider,
        model:         params.model,
        call_site:     params.callSite,
        input_tokens:  params.inputTokens ?? null,
        output_tokens: params.outputTokens ?? null,
        cost_usd:      costUsd,
        user_id:       params.userId ?? null,
        listing_id:    params.listingId ?? null,
      })
    } catch {
      // Tracking failures must never propagate to callers.
    }
  })
}
