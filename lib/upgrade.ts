// date-fns not installed — local implementation with identical semantics:
// differenceInDays(dateLeft, dateRight) = Math.floor((dateLeft - dateRight) / ms_per_day)
function differenceInDays(dateLeft: Date, dateRight: Date): number {
  return Math.floor((dateLeft.getTime() - dateRight.getTime()) / (1000 * 60 * 60 * 24))
}

export type Tier = 'basic' | 'pro' | 'premium'
export type Laufzeit = 1 | 3 | 6

export const TIER_RANK: Record<Tier, number> = {
  basic: 1,
  pro: 2,
  premium: 3,
}

export function tierRank(tier: Tier): number {
  return TIER_RANK[tier]
}

export function berechneRestwert(params: {
  alterPreisEur: number
  gesamtTage: number
  verbleibendeTage: number
}): number {
  const { alterPreisEur, gesamtTage, verbleibendeTage } = params
  if (gesamtTage <= 0) return 0
  if (verbleibendeTage <= 0) return 0
  if (verbleibendeTage >= gesamtTage) return alterPreisEur
  const restwert = alterPreisEur * (verbleibendeTage / gesamtTage)
  return Math.floor(restwert * 100) / 100
}

export type WechselGrund = 'downgrade_tier' | 'downgrade_laufzeit' | 'identisch'

export type WechselErlaubtResult =
  | { erlaubt: true }
  | { erlaubt: false; grund: WechselGrund }

export function istWechselErlaubt(params: {
  altTier: Tier
  altLaufzeit: Laufzeit
  neuTier: Tier
  neuLaufzeit: Laufzeit
}): WechselErlaubtResult {
  const { altTier, altLaufzeit, neuTier, neuLaufzeit } = params
  const rankAlt = TIER_RANK[altTier]
  const rankNeu = TIER_RANK[neuTier]

  if (rankNeu < rankAlt) {
    return { erlaubt: false, grund: 'downgrade_tier' }
  }

  if (neuLaufzeit < altLaufzeit) {
    return { erlaubt: false, grund: 'downgrade_laufzeit' }
  }

  if (rankNeu === rankAlt && neuLaufzeit === altLaufzeit) {
    return { erlaubt: false, grund: 'identisch' }
  }

  return { erlaubt: true }
}

export interface UpgradeKosten {
  restwert: number
  aufpreis: number
}

export function berechneUpgradeKosten(params: {
  altPreisEur: number
  gesamtTage: number
  verbleibendeTage: number
  neuPreisEur: number
}): UpgradeKosten {
  const { altPreisEur, gesamtTage, verbleibendeTage, neuPreisEur } = params
  const restwert = berechneRestwert({ alterPreisEur: altPreisEur, gesamtTage, verbleibendeTage })
  const aufpreis = Math.max(0, neuPreisEur - restwert)
  return { restwert, aufpreis: Math.floor(aufpreis * 100) / 100 }
}

export function berechneVerbleibendeTage(aktivBis: Date, jetzt: Date = new Date()): number {
  return Math.max(0, differenceInDays(aktivBis, jetzt))
}

export function berechneGesamtTage(aktiviertAm: Date, aktivBis: Date): number {
  return Math.max(0, differenceInDays(aktivBis, aktiviertAm))
}

/*
EXPECTED TEST VALUES (kein Test-Runner im Projekt — manuelle Verifikation):

berechneRestwert:
  ({ alterPreisEur: 399, gesamtTage: 90,  verbleibendeTage: 60 }) → 266.00
  ({ alterPreisEur: 169, gesamtTage: 30,  verbleibendeTage: 30 }) → 169.00  // >= gesamtTage → voller Restwert
  ({ alterPreisEur: 169, gesamtTage: 30,  verbleibendeTage: 0  }) → 0.00    // abgelaufen
  ({ alterPreisEur: 869, gesamtTage: 180, verbleibendeTage: 90 }) → 434.50
  ({ alterPreisEur: 399, gesamtTage: 0,   verbleibendeTage: 0  }) → 0.00    // Div-by-0 Schutz

istWechselErlaubt:
  ({ altTier: 'pro',     altLaufzeit: 3, neuTier: 'premium', neuLaufzeit: 6 }) → { erlaubt: true }
  ({ altTier: 'pro',     altLaufzeit: 3, neuTier: 'premium', neuLaufzeit: 3 }) → { erlaubt: true }
  ({ altTier: 'pro',     altLaufzeit: 1, neuTier: 'pro',     neuLaufzeit: 3 }) → { erlaubt: true }
  ({ altTier: 'pro',     altLaufzeit: 1, neuTier: 'pro',     neuLaufzeit: 1 }) → { erlaubt: false, grund: 'identisch' }
  ({ altTier: 'pro',     altLaufzeit: 3, neuTier: 'pro',     neuLaufzeit: 1 }) → { erlaubt: false, grund: 'downgrade_laufzeit' }
  ({ altTier: 'pro',     altLaufzeit: 6, neuTier: 'premium', neuLaufzeit: 1 }) → { erlaubt: false, grund: 'downgrade_laufzeit' }
  ({ altTier: 'premium', altLaufzeit: 6, neuTier: 'pro',     neuLaufzeit: 6 }) → { erlaubt: false, grund: 'downgrade_tier' }
  ({ altTier: 'premium', altLaufzeit: 3, neuTier: 'basic',   neuLaufzeit: 3 }) → { erlaubt: false, grund: 'downgrade_tier' }

berechneUpgradeKosten:
  ({ altPreisEur: 399, gesamtTage: 90, verbleibendeTage: 60, neuPreisEur: 869 }) → { restwert: 266.00, aufpreis: 603.00 }
  ({ altPreisEur: 169, gesamtTage: 30, verbleibendeTage: 30, neuPreisEur: 399 }) → { restwert: 169.00, aufpreis: 230.00 }
  ({ altPreisEur: 399, gesamtTage: 90, verbleibendeTage: 0,  neuPreisEur: 869 }) → { restwert: 0.00,   aufpreis: 869.00 }
*/
