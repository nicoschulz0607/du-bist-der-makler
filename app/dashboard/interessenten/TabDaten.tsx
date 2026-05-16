import { PencilLine } from 'lucide-react'

interface Props {
  interessent: Record<string, unknown>
}

export default function TabDaten({ interessent: _interessent }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <PencilLine size={24} className="text-text-tertiary" />
      <p className="text-[13px] text-text-secondary font-medium">Daten-Tab wird in Commit 3 implementiert.</p>
    </div>
  )
}
