import { Sparkles } from 'lucide-react'

interface Props {
  interessent: Record<string, unknown>
  tier: string
}

export default function TabKiAuswertung({ interessent: _interessent, tier: _tier }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <Sparkles size={24} className="text-text-tertiary" />
      <p className="text-[13px] text-text-secondary font-medium">KI-Auswertung wird in Commit 2 implementiert.</p>
    </div>
  )
}
