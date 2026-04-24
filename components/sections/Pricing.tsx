import { Check } from 'lucide-react'

interface PricingPlan {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  recommended?: boolean
}

const plans: PricingPlan[] = [
  {
    name: 'Basic',
    price: '399',
    period: '/ einmalig',
    description: '6 Monate Laufzeit. Ideal für den Einstieg.',
    features: [
      'ImmoScout24 Listing',
      'eBay Kleinanzeigen Listing',
      'Schritt-für-Schritt Checkliste',
      '24/7 KI-Chatbot',
    ],
    cta: 'Basic wählen',
  },
  {
    name: 'Pro',
    price: '599',
    period: '/ einmalig',
    description: '6 Monate Laufzeit. Für den professionellen Privatverkauf.',
    features: [
      'Alles aus Basic',
      'Immowelt Listing (zusätzliches Portal)',
      'KI-Exposé Generator (PDF)',
      'KI-Preisrechner',
      'CRM-Lite (Interessenten & Termine)',
      'Energieausweis-Partner',
    ],
    cta: 'Pro wählen',
    recommended: true,
  },
  {
    name: 'Premium',
    price: '799',
    period: '/ einmalig',
    description: '6 Monate Laufzeit. Maximale Reichweite, persönlicher Support.',
    features: [
      'Alles aus Pro',
      'Alle verfügbaren Portale + maximale Sichtbarkeit',
      'KI-Bildoptimierung',
      'Makler-Support (erste Stunde inklusive)',
    ],
    cta: 'Premium wählen',
  },
]

export default function Pricing() {
  return (
    <section
      id="preise"
      className="section-padding bg-surface"
      aria-labelledby="pricing-heading"
    >
      <div className="container-landing">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            id="pricing-heading"
            className="text-[36px] md:text-[42px] font-bold text-text-primary headline-section mb-4"
          >
            Transparent. Einmalig. Fair.
          </h2>
          <p className="text-[17px] font-medium text-text-secondary max-w-[480px] mx-auto">
            Keine Provision, kein Abo. Du zahlst einmal und behältst alles.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={[
                'relative bg-white rounded-card p-8 transition-all duration-200',
                plan.recommended
                  ? 'border-2 border-accent shadow-hover'
                  : 'border border-[#DDDDDD] shadow-card hover:shadow-hover hover:-translate-y-0.5',
              ].join(' ')}
            >
              {/* Recommended badge */}
              {plan.recommended && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-pill bg-accent px-4 py-1 text-white text-[12px] font-bold tracking-wide whitespace-nowrap">
                    Empfohlen
                  </span>
                </div>
              )}

              {/* Plan name */}
              <div className="mb-6">
                <h3 className="text-[16px] font-semibold text-text-secondary uppercase tracking-wider mb-4">
                  {plan.name}
                </h3>
                {/* Price */}
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-[48px] font-bold text-text-primary leading-none headline-display">
                    {plan.price} €
                  </span>
                </div>
                <p className="text-[14px] font-medium text-text-secondary mb-3">{plan.period}</p>
                <p className="text-[14px] font-medium text-text-secondary leading-snug">{plan.description}</p>
              </div>

              {/* Divider */}
              <div className="border-t border-[#EEEEEE] mb-6" />

              {/* Features */}
              <ul className="space-y-3 mb-8" aria-label={`${plan.name}-Paket Funktionen`}>
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      size={16}
                      className="text-accent flex-shrink-0 mt-0.5"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                    <span className="text-[14px] font-medium text-text-primary leading-snug">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="#registrieren"
                className={[
                  'block w-full text-center rounded-pill text-[15px] font-semibold px-6 py-3.5 transition-colors duration-150 min-h-[48px] active:scale-[0.98]',
                  plan.recommended
                    ? 'bg-accent hover:bg-accent-hover text-white'
                    : 'border-2 border-[#222222] hover:bg-[#F7F7F7] text-text-primary',
                ].join(' ')}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Add-on note */}
        <p className="text-center text-[13px] font-medium text-text-tertiary mt-8">
          Zusätzlich buchbar: Makler-Stunde für 50 €/h über Calendly + Stripe.
          Premium inkludiert die erste Stunde.
        </p>
      </div>
    </section>
  )
}
