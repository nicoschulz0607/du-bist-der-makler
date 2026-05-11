import { createClient } from '@/lib/supabase/server'
import type { Tier } from '@/lib/stripe-config'

export type PaketTier = Tier
export type PaketTyp = 'paket' | 'reaktivierung' | 'addon'
export type PaketStatus = 'aktiv' | 'abgelaufen' | 'storniert' | 'refunded'

export interface Paket {
  id: string
  user_id: string
  tier: PaketTier | null
  typ: PaketTyp
  laufzeit_monate: 1 | 3 | 6 | null
  addon_type: 'toolpaket' | 'maklerstunde' | null
  start_datum: string
  ende_datum: string
  status: PaketStatus
  stripe_session_id: string
  stripe_payment_intent_id: string | null
  betrag_cent: number
  waehrung: string
  created_at: string
  updated_at: string
}

const TIER_LEVEL: Record<PaketTier, number> = {
  basic: 1,
  pro: 2,
  premium: 3,
}

// Schneller Boolean-Check via profiles-Cache — KEIN JOIN auf pakete!
// minTier: 'pro' → auch premium = true
export async function hasActivePaket(
  userId: string,
  minTier?: PaketTier
): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('paket_tier, paket_aktiv_bis')
    .eq('id', userId)
    .single()

  if (!data?.paket_tier || !data.paket_aktiv_bis) return false
  if (new Date(data.paket_aktiv_bis) < new Date()) return false
  if (!minTier) return true
  return TIER_LEVEL[data.paket_tier as PaketTier] >= TIER_LEVEL[minTier]
}

// Aktuelles aktives Paket (Source of Truth aus pakete-Tabelle)
export async function getActivePaket(userId: string): Promise<Paket | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('pakete')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'aktiv')
    .gt('ende_datum', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data as Paket | null)
}

// Komplette Käufe-Historie
export async function getPaketHistorie(userId: string): Promise<Paket[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('pakete')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return (data as Paket[]) ?? []
}
