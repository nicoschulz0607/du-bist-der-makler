import Link from 'next/link'
import { Zap, Users, Camera, Map, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Partner & Services — Dashboard' }

const partners = [
  {
    icon: <Zap size={22} strokeWidth={1.75} />,
    iconBg: 'bg-yellow-100 text-yellow-700',
    title: 'Energieausweis',
    description: 'Beim Verkauf gesetzlich vorgeschrieben. Über unseren Partner schnell und unkompliziert bestellen.',
    detail: 'Ab ca. 79 € · Pflicht nach Energieeinsparverordnung',
    href: '#',
    cta: 'Jetzt bestellen',
  },
  {
    icon: <Users size={22} strokeWidth={1.75} />,
    iconBg: 'bg-blue-100 text-blue-700',
    title: 'Notarempfehlung',
    description: 'Regionaler Notar für die Kaufvertragsabwicklung. Kostenlos empfohlen über unser Netzwerk.',
    detail: 'Kostenlose Empfehlung · Regionaler Notar',
    href: '#',
    cta: 'Empfehlung anfragen',
  },
  {
    icon: <Camera size={22} strokeWidth={1.75} />,
    iconBg: 'bg-purple-100 text-purple-700',
    title: 'Professioneller Fotograf',
    description: 'Mehr Klicks durch professionelle Immobilienfotos. Regional verfügbar, faire Preise.',
    detail: 'Ab ca. 149 € · Regional verfügbar',
    href: '#',
    cta: 'Fotograf anfragen',
  },
  {
    icon: <Map size={22} strokeWidth={1.75} />,
    iconBg: 'bg-teal-100 text-teal-700',
    title: 'Grundriss-Erstellung',
    description: 'Ein sauberer Grundriss steigert das Interesse deutlich. Schnelle Lieferung digital.',
    detail: 'Ab ca. 49 € · Digital, schnelle Lieferung',
    href: '#',
    cta: 'Grundriss bestellen',
  },
]

export default function PartnerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-text-primary mb-1" style={{ letterSpacing: '-0.18px' }}>
          Partner & Services
        </h1>
        <p className="text-[14px] text-text-secondary">
          Alles was du für einen erfolgreichen Verkauf brauchst — über geprüfte Partner.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {partners.map((partner) => (
          <div
            key={partner.title}
            className="bg-white border border-[#DDDDDD] rounded-xl p-6 flex flex-col"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${partner.iconBg}`}>
              {partner.icon}
            </div>
            <h3 className="text-[15px] font-semibold text-text-primary mb-1.5">{partner.title}</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed mb-3 flex-1">{partner.description}</p>
            <p className="text-[12px] font-medium text-text-tertiary mb-4">{partner.detail}</p>
            <Link
              href={partner.href}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:underline"
            >
              {partner.cta} <ArrowRight size={13} />
            </Link>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-[#DDDDDD] rounded-xl px-5 py-4">
        <p className="text-[13px] font-medium text-text-secondary">
          Partner-Links werden in Kürze aktiv geschaltet. Bei Fragen: <a href="mailto:hallo@du-bist-der-makler.de" className="text-accent hover:underline font-semibold">hallo@du-bist-der-makler.de</a>
        </p>
      </div>
    </div>
  )
}
