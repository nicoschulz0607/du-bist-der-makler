import { fetchUmsatzZeitraum } from '@/lib/helios/sources/stripe'
import { createServiceClient } from '@/lib/supabase/service'
import { gesamtKostenCent, kostenNachTier, type Zeitraum } from './kosten'

export type { Zeitraum }

export interface MargeZeitraum {
  zeitraum: Zeitraum
  umsatzCent: number               // EUR cents (Stripe)
  aiKostenEurCent: number          // EUR cents (ai_usage_log USD converted via USD_TO_EUR_RATE)
  fixkostenCent: number            // EUR cents (fixed_costs, zeitraum-anteilig auf 30-Tage-Basis)
  affiliateEinnahmenCent: number   // EUR cents (affiliate_revenue)
  rohmargeApproxCent: number       // umsatz + affiliate − aiKosten − fixkosten (alles EUR cents)
  aiKostenNachTier: Record<string, number>  // tier | 'kein_paket' → EUR cents
}

async function fixkostenFuerZeitraum(zeitraum: Zeitraum): Promise<number> {
  const service = createServiceClient()
  const vonDate = zeitraum.von.slice(0, 10)
  const bisDate = zeitraum.bis.slice(0, 10)

  const { data } = await service
    .from('fixed_costs')
    .select('betrag_cent, gueltig_ab, gueltig_bis')
    .lte('gueltig_ab', bisDate)
    .or(`gueltig_bis.is.null,gueltig_bis.gte.${vonDate}`)

  if (!data || data.length === 0) return 0

  const zeitraumTage =
    (new Date(zeitraum.bis).getTime() - new Date(zeitraum.von).getTime()) / 86400_000

  return (data as Array<{ betrag_cent: number }>).reduce(
    (sum, fc) => sum + Math.round(fc.betrag_cent * (zeitraumTage / 30)),
    0
  )
}

async function affiliateEinnahmenFuerZeitraum(zeitraum: Zeitraum): Promise<number> {
  const service = createServiceClient()
  const { data } = await service
    .from('affiliate_revenue')
    .select('betrag_cent')
    .gte('erstellt_am', zeitraum.von.slice(0, 10))
    .lte('erstellt_am', zeitraum.bis.slice(0, 10))

  return ((data ?? []) as Array<{ betrag_cent: number }>).reduce(
    (sum, r) => sum + r.betrag_cent,
    0
  )
}

export async function getMargeZeitraum(zeitraum: Zeitraum): Promise<MargeZeitraum> {
  const [umsatz, aiKosten, aiNachTier, fixkosten, affiliate] = await Promise.all([
    fetchUmsatzZeitraum(zeitraum.von, zeitraum.bis),
    gesamtKostenCent(zeitraum),
    kostenNachTier(zeitraum),
    fixkostenFuerZeitraum(zeitraum),
    affiliateEinnahmenFuerZeitraum(zeitraum),
  ])

  return {
    zeitraum,
    umsatzCent:             umsatz.totalCents,
    aiKostenEurCent:        aiKosten,
    fixkostenCent:          fixkosten,
    affiliateEinnahmenCent: affiliate,
    rohmargeApproxCent:     umsatz.totalCents + affiliate - aiKosten - fixkosten,
    aiKostenNachTier:       aiNachTier,
  }
}

function monatStart(offset = 0): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + offset, 1).toISOString()
}

function monatEnde(offset = 0): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + offset + 1, 0, 23, 59, 59).toISOString()
}

export async function margeAktuellerMonat(): Promise<MargeZeitraum> {
  return getMargeZeitraum({ von: monatStart(0), bis: monatEnde(0) })
}

export async function margeVormonat(): Promise<MargeZeitraum> {
  return getMargeZeitraum({ von: monatStart(-1), bis: monatEnde(-1) })
}
