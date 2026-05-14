import { fetchFunnel, fetchTopUtmQuellen } from '@/lib/helios/sources/posthog'
import type { UtmQuelle } from '@/lib/helios/sources/posthog'

export interface ConversionStage {
  name: string
  count: number
  conversionFromPrev: number | null  // null für erste Stage
}

export interface ConversionFunnel {
  stages: ConversionStage[]
  total_conversions: number | null  // null wenn PostHog keine Daten liefert
}

export interface ConversionDaten {
  funnel: ConversionFunnel
  conversionRate: number | null  // null statt 0 wenn keine PostHog-Daten
  topUtmQuellen: UtmQuelle[]
}

export async function getConversionDaten(tage = 30): Promise<ConversionDaten> {
  const [funnelResult, utmQuellen] = await Promise.all([
    fetchFunnel(tage),
    fetchTopUtmQuellen(tage),
  ])

  // PostHog nicht konfiguriert oder keine Events → sichere Leerwerte
  if (funnelResult.steps.length === 0) {
    return {
      funnel: { stages: [], total_conversions: null },
      conversionRate: null,
      topUtmQuellen: utmQuellen,
    }
  }

  const stages: ConversionStage[] = funnelResult.steps.map((step, i) => ({
    name:              step.name,
    count:             step.count,
    conversionFromPrev: i === 0 ? null : step.conversionFromPrev,
  }))

  const firstCount = funnelResult.steps[0].count
  const lastCount  = funnelResult.steps[funnelResult.steps.length - 1].count

  return {
    funnel: {
      stages,
      total_conversions: lastCount,
    },
    conversionRate: firstCount > 0 ? funnelResult.overallConversion : null,
    topUtmQuellen: utmQuellen,
  }
}
