'use client'

import KiScoreCard from '@/app/dashboard/interessenten/[id]/KiScoreCard'
import { canAccess, type Tier } from '@/lib/tier'

interface Props {
  interessent: Record<string, unknown>
  tier: string
}

export default function TabKiAuswertung({ interessent, tier }: Props) {
  const canScore =
    canAccess(tier as Tier, 'pro') &&
    !!interessent.finanzierung_status &&
    !!interessent.zeithorizont

  return (
    <KiScoreCard
      interessentId={interessent.id as string}
      score={interessent.ki_score as number | null}
      ampel={interessent.ki_ampel as string | null}
      begruendung={interessent.ki_begruendung as string | null}
      klaerungsfragen={(interessent.ki_klaerungsfragen as string[]) ?? []}
      redFlags={(interessent.ki_red_flags as string[]) ?? []}
      basisFelder={interessent.ki_score_basis_felder as number | null}
      aktualisiert={interessent.ki_score_aktualisiert_am as string | null}
      canScore={canScore}
      tier={tier as Tier}
      finanzierungSet={!!interessent.finanzierung_status}
      zeithorizontSet={!!interessent.zeithorizont}
    />
  )
}
