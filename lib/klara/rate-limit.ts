import type { SupabaseClient } from '@supabase/supabase-js'

const LIMITS: Record<string, number> = {
  starter: 30,
  pro: 100,
  premium: 500,
}

export async function checkRateLimit(
  userId: string,
  supabase: SupabaseClient
): Promise<{ allowed: boolean; remaining: number; limit: number; message: string | null }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('paket_tier')
    .eq('id', userId)
    .single()

  const tier = profile?.paket_tier ?? 'starter'
  const limit = LIMITS[tier] ?? LIMITS.starter
  const today = new Date().toISOString().split('T')[0]

  const { data: usage } = await supabase
    .from('klara_usage')
    .select('message_count')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .maybeSingle()

  const used = usage?.message_count ?? 0

  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    limit,
    message:
      used >= limit
        ? `Du hast dein Tageslimit von ${limit} Fragen erreicht. Morgen geht's weiter — oder upgrade auf ein höheres Paket für mehr.`
        : null,
  }
}

export async function recordUsage(
  userId: string,
  usage: { input_tokens: number; output_tokens: number },
  supabase: SupabaseClient
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  const tokens = (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0)

  // Upsert: erstelle Zeile wenn nicht vorhanden, sonst addiere
  const { data: existing } = await supabase
    .from('klara_usage')
    .select('message_count, tokens_total')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('klara_usage')
      .update({
        message_count: existing.message_count + 1,
        tokens_total: existing.tokens_total + tokens,
      })
      .eq('user_id', userId)
      .eq('usage_date', today)
  } else {
    await supabase.from('klara_usage').insert({
      user_id: userId,
      usage_date: today,
      message_count: 1,
      tokens_total: tokens,
    })
  }
}
