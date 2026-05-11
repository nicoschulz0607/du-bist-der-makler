export type Tier = 'basic' | 'pro' | 'premium'
export type Laufzeit = 1 | 3 | 6

const PRICE_IDS: Record<Tier, Record<Laufzeit, string>> = {
  basic: {
    1: process.env.STRIPE_PRICE_BASIC_1M!,
    3: process.env.STRIPE_PRICE_BASIC_3M!,
    6: process.env.STRIPE_PRICE_BASIC_6M!,
  },
  pro: {
    1: process.env.STRIPE_PRICE_PRO_1M!,
    3: process.env.STRIPE_PRICE_PRO_3M!,
    6: process.env.STRIPE_PRICE_PRO_6M!,
  },
  premium: {
    1: process.env.STRIPE_PRICE_PREMIUM_1M!,
    3: process.env.STRIPE_PRICE_PREMIUM_3M!,
    6: process.env.STRIPE_PRICE_PREMIUM_6M!,
  },
}

const REACTIVATION_PRICE_IDS: Record<Tier, string> = {
  basic:   process.env.STRIPE_PRICE_REACTIVATE_BASIC!,
  pro:     process.env.STRIPE_PRICE_REACTIVATE_PRO!,
  premium: process.env.STRIPE_PRICE_REACTIVATE_PREMIUM!,
}

export const TOOLPAKET_PRICE_ID    = process.env.STRIPE_PRICE_TOOLPAKET!
export const MAKLERSTUNDE_PRICE_ID = process.env.STRIPE_PRICE_MAKLERSTUNDE!

export function getPriceId(tier: Tier, laufzeit: Laufzeit): string {
  return PRICE_IDS[tier][laufzeit]
}

export function getReactivationPriceId(tier: Tier): string {
  return REACTIVATION_PRICE_IDS[tier]
}

// Returns Brutto-Preis in EUR (not cents) — used for server-side restwert calculation
export function getPaketPreis(tier: Tier, laufzeit: Laufzeit): number {
  return PAKET_PREISE[tier][laufzeit] / 100
}

// Brutto-Preise in Euro-Cent für UI-Darstellung
export const PAKET_PREISE: Record<Tier, Record<Laufzeit, number>> = {
  basic:   { 1: 12900, 3: 29900, 6: 49900 },
  pro:     { 1: 16900, 3: 39900, 6: 66900 },
  premium: { 1: 21900, 3: 51900, 6: 86900 },
}

export const REAKTIVIERUNG_PREISE: Record<Tier, number> = {
  basic:   14900,
  pro:     19900,
  premium: 25900,
}

export const ADDON_PREISE = {
  toolpaket:    3900,
  maklerstunde: 5000,
}
