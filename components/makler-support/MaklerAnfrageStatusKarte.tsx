import { CheckCircle2, Clock, XCircle, CheckSquare, Download } from 'lucide-react'

type Anfrage = {
  id: string
  status: string
  thema: string
  bestätigter_termin: string | null
  bestätigte_dauer_minuten: number | null
  admin_notiz: string | null
  created_at: string
}

interface Props {
  anfrage: Anfrage
  onNewAnfrage?: () => void
}

const THEMA_LABELS: Record<string, string> = {
  preisverhandlung: 'Preisverhandlung',
  vertragsfragen: 'Vertragsfragen',
  besichtigung: 'Besichtigung',
  sonstiges: 'Sonstiges',
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function MaklerAnfrageStatusKarte({ anfrage, onNewAnfrage }: Props) {
  if (anfrage.status === 'neu') {
    return (
      <div className="flex items-start gap-4 bg-[#FFF9EC] border border-[#C07000]/30 rounded-xl px-5 py-4">
        <Clock size={20} className="text-[#C07000] flex-shrink-0 mt-0.5" strokeWidth={1.75} />
        <div>
          <p className="text-[15px] font-semibold text-[#7A4500]">Anfrage wartet auf Bestätigung</p>
          <p className="text-[13px] text-[#C07000]/80 mt-0.5">
            Thema: {THEMA_LABELS[anfrage.thema] ?? anfrage.thema} · Antwort innerhalb 24 Stunden
          </p>
        </div>
      </div>
    )
  }

  if (anfrage.status === 'bestätigt') {
    return (
      <div className="bg-[#E8F5EE] border border-[#1B6B45]/30 rounded-xl px-5 py-4">
        <div className="flex items-start gap-4">
          <CheckCircle2 size={20} className="text-[#1B6B45] flex-shrink-0 mt-0.5" strokeWidth={1.75} />
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-[#1B6B45]">Termin bestätigt!</p>
            {anfrage.bestätigter_termin && (
              <p className="text-[14px] font-bold text-text-primary mt-1">
                {formatDateTime(anfrage.bestätigter_termin)}
              </p>
            )}
            <p className="text-[13px] text-text-secondary mt-0.5">
              Dauer: {anfrage.bestätigte_dauer_minuten ?? 60} Minuten · Telefonisch
            </p>
          </div>
          {anfrage.bestätigter_termin && (
            <a
              href={`/api/makler-anfragen/${anfrage.id}/ics`}
              className="flex-shrink-0 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1B6B45] hover:underline"
            >
              <Download size={14} />
              Kalender
            </a>
          )}
        </div>
      </div>
    )
  }

  if (anfrage.status === 'abgelehnt') {
    return (
      <div className="bg-[#FEF2F2] border border-red-200 rounded-xl px-5 py-4">
        <div className="flex items-start gap-4">
          <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-red-700">Termin konnte nicht realisiert werden</p>
            {anfrage.admin_notiz && (
              <p className="text-[13px] text-red-600/80 mt-1">{anfrage.admin_notiz}</p>
            )}
          </div>
          {onNewAnfrage && (
            <button
              type="button"
              onClick={onNewAnfrage}
              className="flex-shrink-0 text-[13px] font-semibold text-[#1B6B45] hover:underline"
            >
              Neue Anfrage
            </button>
          )}
        </div>
      </div>
    )
  }

  if (anfrage.status === 'abgeschlossen') {
    return (
      <div className="flex items-center gap-4 bg-[#F9F9F9] border border-[#DDDDDD] rounded-xl px-5 py-4">
        <CheckSquare size={20} className="text-text-secondary flex-shrink-0" strokeWidth={1.75} />
        <p className="text-[14px] text-text-secondary">
          Beratung abgeschlossen {anfrage.bestätigter_termin ? `am ${formatDateTime(anfrage.bestätigter_termin)}` : ''}
        </p>
      </div>
    )
  }

  return null
}
