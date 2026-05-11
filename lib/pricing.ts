import { PAKET_PREISE, type Tier, type Laufzeit } from '@/lib/stripe-config'

export { PAKET_PREISE }

export function getUpgradeDiffCent(from: Tier, to: Tier, laufzeit: Laufzeit = 1): number {
  return PAKET_PREISE[to][laufzeit] - PAKET_PREISE[from][laufzeit]
}

export function formatPreisEuro(cent: number): string {
  return `${Math.round(cent / 100)} €`
}
