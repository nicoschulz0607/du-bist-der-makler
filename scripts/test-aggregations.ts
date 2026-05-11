// Sanity-check for Sprint 3b aggregation layer.
// Run: npx tsx scripts/test-aggregations.ts
//
// Requires SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL in .env.local

import { config } from 'dotenv'
config({ path: '.env.local' })

// ── Polyfill next/cache ────────────────────────────────────────────────────
// unstable_cache needs a Next.js request context. Outside it, we inject a
// passthrough into the require cache before any aggregation module is loaded.
{
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('module') as { createRequire(f: string): NodeRequire }
  const req = mod.createRequire(__filename)
  try {
    const id = req.resolve('next/cache')
    if (!require.cache[id]) {
      require.cache[id] = Object.assign(Object.create(null), {
        id, filename: id, loaded: true,
        exports: {
          // passthrough: unstable_cache(fn, keys, opts) → fn
          unstable_cache: <T extends (...a: unknown[]) => unknown>(fn: T) => fn,
          revalidatePath:  () => {},
          revalidateTag:   () => {},
        },
      }) as NodeModule
    }
  } catch { /* next/cache not resolvable — Next.js will handle it at runtime */ }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function eur(cent: number): string {
  return `${(cent / 100).toFixed(2)} € (${cent} ct)`
}

// Allow ±TOLERANCE cents: sum-of-rounded-parts ≠ rounded-sum due to float partitioning.
const TOLERANCE = 2

function invariant(label: string, a: number, bLabel: string, b: number): boolean {
  const diff = Math.abs(a - b)
  if (diff <= TOLERANCE) {
    const note = diff > 0 ? ` — rounding delta: ${diff} ct` : ''
    console.log(`   ✓ ${label} OK${note}`)
    return true
  }
  console.log(`   ✗ ${label} FAIL: sum = ${a} ct  ≠  ${bLabel} = ${b} ct  (delta: ${diff} ct)`)
  return false
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Sprint 3b — Aggregations Sanity-Check ===\n')

  const von = new Date(Date.now() - 30 * 86400_000).toISOString()
  const bis = new Date().toISOString()
  const zeitraum = { von, bis }
  console.log(`Zeitraum: ${von.slice(0, 10)} → ${bis.slice(0, 10)}\n`)

  // Dynamic imports run AFTER next/cache patch above
  const {
    gesamtKostenCent,
    kostenProProvider,
    kostenProCallSite,
    kostenNachTier,
  } = await import('../lib/helios/aggregations/kosten')

  const { margeAktuellerMonat } = await import('../lib/helios/aggregations/marge')

  let ok = true

  // ── 1. gesamtKostenCent ─────────────────────────────────────────────────
  console.log('── 1. gesamtKostenCent ──────────────────────────')
  const gesamt = await gesamtKostenCent(zeitraum)
  console.log(`   → ${eur(gesamt)}`)
  if (gesamt === 0) console.log('   (ai_usage_log leer oder keine Kosten — Invarianten trivial)')
  console.log()

  // ── 2. kostenProProvider + Invariant 1 ─────────────────────────────────
  console.log('── 2. kostenProProvider ─────────────────────────')
  const prov = await kostenProProvider(zeitraum)
  console.log(`   anthropic  ${eur(prov.anthropic)}`)
  console.log(`   fal        ${eur(prov.fal)}`)
  console.log(`   replicate  ${eur(prov.replicate)}`)
  const sumProv = prov.anthropic + prov.fal + prov.replicate
  ok = invariant('Invariant 1: sum(provider) == gesamtKosten', sumProv, 'gesamt', gesamt) && ok
  console.log()

  // ── 3. kostenProCallSite ────────────────────────────────────────────────
  console.log('── 3. kostenProCallSite (Top-5) ─────────────────')
  const bySite = await kostenProCallSite(zeitraum)
  const siteEntries = Object.entries(bySite)
  if (siteEntries.length === 0) {
    console.log('   (keine Daten)')
  } else {
    for (const [site, cent] of siteEntries.slice(0, 5)) {
      console.log(`   ${site.padEnd(32)} ${eur(cent)}`)
    }
    if (siteEntries.length > 5) console.log(`   … ${siteEntries.length - 5} weitere`)
  }
  console.log()

  // ── 4. kostenNachTier + Invariant 2 ────────────────────────────────────
  console.log('── 4. kostenNachTier (historisch, inkl. kein_paket) ─')
  const nachTier = await kostenNachTier(zeitraum)
  const tierEntries = Object.entries(nachTier)
  if (tierEntries.length === 0) {
    console.log('   (keine Daten)')
  } else {
    for (const [tier, cent] of tierEntries) {
      console.log(`   ${tier.padEnd(15)} ${eur(cent)}`)
    }
  }
  const sumTier = tierEntries.reduce((s, [, v]) => s + v, 0)
  ok = invariant('Invariant 2: sum(tier inkl. kein_paket) == gesamtKosten', sumTier, 'gesamt', gesamt) && ok
  console.log()

  // ── 5. margeAktuellerMonat ──────────────────────────────────────────────
  console.log('── 5. margeAktuellerMonat ───────────────────────')
  const marge = await margeAktuellerMonat()
  const m = marge.zeitraum
  console.log(`   Zeitraum:              ${m.von.slice(0, 10)} → ${m.bis.slice(0, 10)}`)
  console.log(`   umsatzCent             ${eur(marge.umsatzCent)}`)
  console.log(`   aiKostenEurCent        ${eur(marge.aiKostenEurCent)}`)
  console.log(`   fixkostenCent          ${eur(marge.fixkostenCent)}`)
  console.log(`   affiliateEinnahmenCent ${eur(marge.affiliateEinnahmenCent)}`)
  console.log(`   rohmargeApproxCent     ${eur(marge.rohmargeApproxCent)}`)
  if (Object.keys(marge.aiKostenNachTier).length > 0) {
    console.log('   aiKostenNachTier:')
    for (const [tier, cent] of Object.entries(marge.aiKostenNachTier)) {
      console.log(`     ${tier.padEnd(15)} ${eur(cent)}`)
    }
  }
  console.log()

  // ── Result ──────────────────────────────────────────────────────────────
  console.log(`=== ${ok ? '✓ PASS — bereit für Sprint 3c' : '✗ FAIL — Invarianten prüfen'} ===`)
  process.exit(ok ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
