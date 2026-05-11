// Manual verification script for Sprint 3a AI tracking.
// Run: npx tsx scripts/test-ai-tracking.ts
//
// Requires ANTHROPIC_API_KEY and SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL in .env.local

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

async function main() {
  console.log('=== AI Tracking Test ===\n')

  // 1. Verify pricing calculation
  const { calcAnthropicCost } = await import('../lib/ai/pricing')
  const cost = calcAnthropicCost('claude-haiku-4-5-20251001', 1000, 200)
  const expected = (1000 / 1_000_000) * 1.00 + (200 / 1_000_000) * 5.00
  console.log(`Pricing calc: $${cost?.toFixed(7)} (expected $${expected.toFixed(7)}) → ${Math.abs((cost ?? 0) - expected) < 1e-9 ? 'PASS' : 'FAIL'}`)

  // 2. Make a minimal Claude call through the wrapper
  const { claudeCreate } = await import('../lib/ai/anthropic')
  console.log('\nSending test call to Claude (haiku)...')
  const before = new Date()

  const response = await claudeCreate(
    {
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages:   [{ role: 'user', content: 'Reply with exactly: OK' }],
    },
    { callSite: 'test-script' }
  )
  console.log(`Claude responded: "${response.content[0].type === 'text' ? response.content[0].text : '?'}"`)
  console.log(`Tokens: ${response.usage.input_tokens} in / ${response.usage.output_tokens} out`)

  // 3. Wait briefly for fire-and-forget insert, then check DB
  await new Promise((r) => setTimeout(r, 1500))

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('ai_usage_log')
    .select('*')
    .eq('call_site', 'test-script')
    .gte('created_at', before.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    console.error('\nFAIL — No row found in ai_usage_log:', error?.message ?? 'empty result')
    process.exit(1)
  }

  console.log('\nai_usage_log row:')
  console.log(`  provider:      ${data.provider}`)
  console.log(`  model:         ${data.model}`)
  console.log(`  call_site:     ${data.call_site}`)
  console.log(`  input_tokens:  ${data.input_tokens}`)
  console.log(`  output_tokens: ${data.output_tokens}`)
  console.log(`  cost_usd:      $${data.cost_usd}`)

  const pass = data.provider === 'anthropic'
    && data.cost_usd !== null
    && data.cost_usd > 0

  console.log(`\n${pass ? 'PASS' : 'FAIL'} — tracking row ${pass ? 'correct' : 'has issues'}`)
  process.exit(pass ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
