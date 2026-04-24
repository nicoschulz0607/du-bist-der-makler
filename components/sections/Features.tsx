import { Sparkles, TrendingUp, Users, BadgeEuro } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: Sparkles,
    title: 'KI-Exposé Generator',
    description:
      'Professionelles PDF-Exposé aus Fotos und deinen Angaben — erstellt von Claude AI in Minuten, nicht Stunden.',
  },
  {
    icon: TrendingUp,
    title: 'KI-Preisrechner',
    description:
      'Marktwertschätzung auf Basis von Lage, Größe und Zustand. Datenbasiert, nicht geraten — mit klarem Disclaimer.',
  },
  {
    icon: Users,
    title: 'Interessenten-CRM',
    description:
      'Anfragen verwalten, Besichtigungstermine planen, Status tracken. Alles an einem Ort, kein Chaos in der Inbox.',
  },
  {
    icon: BadgeEuro,
    title: 'Keine Provision',
    description:
      'Du zahlst einmal, fertig. Keine 3–6 % Maklercourtage, keine versteckten Kosten, keine Überraschungen.',
  },
]

export default function Features() {
  return (
    <section
      className="section-padding bg-white"
      aria-labelledby="features-heading"
    >
      <div className="container-landing">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            id="features-heading"
            className="text-[36px] md:text-[42px] font-bold text-text-primary headline-section mb-4"
          >
            Alles, was du brauchst — nichts, was du nicht brauchst
          </h2>
          <p className="text-[17px] font-medium text-text-secondary max-w-[520px] mx-auto">
            Professionelle Werkzeuge für Privatverkäufer, die sonst nur Makler haben.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="bg-white rounded-card border border-[#DDDDDD] p-6 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-hover hover:border-accent group"
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center mb-5 transition-colors duration-150 group-hover:bg-accent/10"
                  aria-hidden="true"
                >
                  <Icon size={24} className="text-accent" strokeWidth={1.5} />
                </div>

                <h3 className="text-[17px] font-semibold text-text-primary headline-sub mb-2">
                  {feature.title}
                </h3>
                <p className="text-[14px] font-medium text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
