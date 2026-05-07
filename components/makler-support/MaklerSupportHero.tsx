import { Phone, Clock, Shield, MessageCircle, FileText, Home } from 'lucide-react'

type ShowState = 'premium_inklusiv_verfügbar' | 'premium_zahlpflichtig' | 'standard_zahlpflichtig'

interface Props {
  showState: ShowState
}

const USE_CASES = [
  {
    icon: <MessageCircle size={18} strokeWidth={1.75} />,
    title: 'Preisverhandlung läuft schief',
    desc: 'Taktische Beratung für schwierige Verhandlungen',
  },
  {
    icon: <FileText size={18} strokeWidth={1.75} />,
    title: 'Notarvertrag prüfen',
    desc: 'Vertragsklauseln verstehen und einordnen',
  },
  {
    icon: <Home size={18} strokeWidth={1.75} />,
    title: 'Besichtigung vorbereiten',
    desc: 'Tipps für eine überzeugende Präsentation',
  },
]

export default function MaklerSupportHero({ showState }: Props) {
  const hinweis =
    showState === 'premium_inklusiv_verfügbar'
      ? { text: '🎁 Deine erste Stunde ist in deinem Premium-Paket inklusive — keine Zahlung nötig.', className: 'bg-[#E8F5EE] border-[#1B6B45]/30 text-[#1B6B45]' }
      : showState === 'premium_zahlpflichtig'
      ? { text: 'Deine Inklusiv-Stunde wurde bereits genutzt. Weitere Beratungen: 50€ pro Stunde.', className: 'bg-[#FFF4E0] border-[#C07000]/30 text-[#7A4500]' }
      : { text: 'Persönliche Makler-Beratung: 50€ pro Stunde. Premium-Kunden erhalten die erste Stunde geschenkt.', className: 'bg-[#F5F5F5] border-[#DDDDDD] text-text-secondary' }

  return (
    <div className="space-y-5">
      {/* Makler-Profil */}
      <div className="bg-white rounded-xl border border-[#EEEEEE] p-6 flex gap-5 items-start">
        <div className="w-16 h-16 rounded-full bg-[#E8F5EE] flex items-center justify-center flex-shrink-0">
          <Phone size={28} className="text-[#1B6B45]" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[16px] font-bold text-text-primary mb-0.5">Dein Makler-Kollege</p>
          <p className="text-[13px] text-text-secondary mb-3">15 Jahre Erfahrung, lizenzierter Makler in Nordrhein-Westfalen</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5 text-[13px] text-text-secondary">
              <Clock size={14} strokeWidth={1.75} />
              <span>Werktags 17–20 Uhr, Samstags 10–14 Uhr</span>
            </div>
            <div className="flex items-center gap-1.5 text-[13px] text-[#1B6B45]">
              <Shield size={14} strokeWidth={1.75} />
              <span>Antwort auf deine Anfrage innerhalb von 24 Stunden</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hinweis-Banner */}
      <div className={`border rounded-xl px-5 py-3 text-[13px] font-medium ${hinweis.className}`}>
        {hinweis.text}
      </div>

      {/* Use-Case-Karten */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {USE_CASES.map(({ icon, title, desc }) => (
          <div key={title} className="bg-white rounded-xl border border-[#EEEEEE] p-4">
            <div className="w-8 h-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center text-[#1B6B45] mb-3">
              {icon}
            </div>
            <p className="text-[13px] font-semibold text-text-primary mb-1">{title}</p>
            <p className="text-[12px] text-text-secondary">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
