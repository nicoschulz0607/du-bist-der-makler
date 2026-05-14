import { unstable_cache } from 'next/cache'
import { createStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'

export interface UmsatzZeitraum {
  totalCents: number
  count: number
}

export const fetchUmsatzZeitraum = unstable_cache(
  async (fromIso: string, toIso: string): Promise<UmsatzZeitraum> => {
    const from = Math.floor(new Date(fromIso).getTime() / 1000)
    const to   = Math.floor(new Date(toIso).getTime() / 1000)

    let totalCents = 0
    let count = 0

    // Iterate through paginated charge list
    for await (const charge of createStripe().charges.list({
      created: { gte: from, lte: to },
      limit: 100,
    })) {
      if (charge.paid && !charge.refunded && charge.status === 'succeeded') {
        totalCents += charge.amount
        count++
      }
    }

    return { totalCents, count }
  },
  ['helios-umsatz'],
  { revalidate: 300 }
)

export interface PaketMix {
  basic: number
  pro: number
  premium: number
  gesamt: number
}

// Paket-Mix aus Supabase (zuverlässiger als Stripe-Metadaten)
export const fetchPaketMix = unstable_cache(
  async (): Promise<PaketMix> => {
    const service = createServiceClient()
    const { data } = await service
      .from('profiles')
      .select('paket_tier')
      .not('paket_tier', 'is', null)
      .not('paket_aktiv_bis', 'is', null)
      .gte('paket_aktiv_bis', new Date().toISOString())

    const mix: PaketMix = { basic: 0, pro: 0, premium: 0, gesamt: 0 }
    for (const row of data ?? []) {
      const tier = row.paket_tier as string
      if (tier === 'basic' || tier === 'pro' || tier === 'premium') {
        mix[tier]++
        mix.gesamt++
      }
    }

    return mix
  },
  ['helios-paket-mix'],
  { revalidate: 300 }
)
