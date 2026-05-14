import { fetchUmsatzZeitraum } from '@/lib/helios/sources/stripe'

function monatStart(offset = 0): Date {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + offset, 1)
}

function monatEnde(offset = 0): Date {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + offset + 1, 0, 23, 59, 59)
}

export async function umsatzAktuellerMonat() {
  return fetchUmsatzZeitraum(
    monatStart(0).toISOString(),
    monatEnde(0).toISOString()
  )
}

export async function umsatzVormonat() {
  return fetchUmsatzZeitraum(
    monatStart(-1).toISOString(),
    monatEnde(-1).toISOString()
  )
}

export interface UmsatzTrend {
  aktuellerMonatCents: number
  vormonatCents: number
  changePercent: number
  direction: 'up' | 'down' | 'neutral'
}

export async function umsatzTrend(): Promise<UmsatzTrend> {
  const [aktuell, vormonat] = await Promise.all([
    umsatzAktuellerMonat(),
    umsatzVormonat(),
  ])

  const changePercent =
    vormonat.totalCents === 0
      ? 0
      : ((aktuell.totalCents - vormonat.totalCents) / vormonat.totalCents) * 100

  const rounded = Math.round(changePercent * 10) / 10

  return {
    aktuellerMonatCents: aktuell.totalCents,
    vormonatCents: vormonat.totalCents,
    changePercent: rounded,
    direction: rounded > 1 ? 'up' : rounded < -1 ? 'down' : 'neutral',
  }
}
