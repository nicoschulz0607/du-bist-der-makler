import DokumentStatusBadge from '@/components/dokumente/DokumentStatusBadge'
import { DokumentDefinition } from '@/lib/dokumente/katalog'
import {
  BookOpen, Zap, Map, CreditCard, Stamp, Ruler, SquareDashed,
  Wrench, Shield, Layers, FileText, Receipt, Banknote, Users,
  PlugZap, Mountain, Building2, HelpCircle,
} from 'lucide-react'

type Status = 'fehlt' | 'angefragt' | 'vorhanden' | 'nicht_relevant'

interface DokumentMitStatus extends DokumentDefinition {
  db_id?: string
  status: Status
  datei_name?: string | null
  datei_url?: string | null
  notiz?: string | null
}

const ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  BookOpen, Zap, Map, CreditCard, Stamp, Ruler, SquareDashed,
  Wrench, Shield, Layers, FileText, Receipt, Banknote, Users,
  PlugZap, Mountain, Building2,
}

interface DokumentKarteProps {
  dokument: DokumentMitStatus
  onClick: () => void
}

export default function DokumentKarte({ dokument, onClick }: DokumentKarteProps) {
  const Icon = ICONS[dokument.icon] ?? HelpCircle

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-[#EEEEEE] rounded-xl p-4 hover:border-accent/40 hover:shadow-sm transition-all duration-150 group"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 transition-colors">
          <Icon size={16} strokeWidth={1.5} className="text-text-secondary group-hover:text-accent transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-medium text-text-primary leading-tight">{dokument.name}</span>
            {dokument.pflicht && (
              <span className="text-[10px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">Pflicht</span>
            )}
          </div>
          <div className="mt-1.5">
            <DokumentStatusBadge status={dokument.status} />
          </div>
          {dokument.status === 'vorhanden' && dokument.datei_name && (
            <p className="mt-1 text-[11px] text-text-secondary truncate">{dokument.datei_name}</p>
          )}
        </div>
      </div>
    </button>
  )
}

export type { DokumentMitStatus }
