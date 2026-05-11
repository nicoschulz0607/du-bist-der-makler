// SLA-Tracking (Antwortzeit) deferred bis Sprint 5 — makler_anfragen hat kein bestaetigt_am.
// Bis dahin: Anfrage-Volumen + Überfällige als operative KPIs.
import { createServiceClient } from '@/lib/supabase/service'
import {
  fetchListingsOhneAktivitaet,
  fetchAnfragenVolumen,
  fetchUpcomingMaklerTermine,
} from '@/lib/helios/sources/supabase'
import type { HeliosListing, HeliosMaklerTermin, AnfragenVolumenDaten } from '@/lib/helios/sources/supabase'
import { fetchPaketMix } from '@/lib/helios/sources/stripe'
import type { PaketMix } from '@/lib/helios/sources/stripe'

// TODO: in fixed_costs.slots pflegen wenn Vertrag sich ändert
const IMMO_SCOUT_SLOTS = 10

export interface OperationsDaten {
  anfragenDaten: AnfragenVolumenDaten  // 30-Tage-Volumen
  anfragenLetzt7Tage: number           // 7-Tage-Count für Hero-KPI
  immoScoutAktiv: number
  immoScoutKapazitaet: number
  inaktiveListings: HeliosListing[]
  upcomingTermine: HeliosMaklerTermin[]
}

export async function aktiveListingsNachTier(): Promise<PaketMix> {
  return fetchPaketMix()
}

export async function inaktiveListings(): Promise<HeliosListing[]> {
  return fetchListingsOhneAktivitaet(14)
}

export async function getOperationsDaten(): Promise<OperationsDaten> {
  const [anfragenDaten, anfragenDaten7d, inaktive, upcomingTermine, immoScoutAktiv] = await Promise.all([
    fetchAnfragenVolumen(30),
    fetchAnfragenVolumen(7),
    fetchListingsOhneAktivitaet(14),
    fetchUpcomingMaklerTermine(7),
    countImmoScoutVeroeffentlicht(),
  ])

  return {
    anfragenDaten,
    anfragenLetzt7Tage: anfragenDaten7d.total,
    immoScoutAktiv,
    immoScoutKapazitaet: IMMO_SCOUT_SLOTS,
    inaktiveListings: inaktive,
    upcomingTermine,
  }
}

async function countImmoScoutVeroeffentlicht(): Promise<number> {
  try {
    const service = createServiceClient()
    const { count } = await service
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'aktiv')
      .eq('immoscout_status', 'Veröffentlicht')
    return count ?? 0
  } catch {
    return 0
  }
}
