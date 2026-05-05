import Image from 'next/image'
import { CheckCircle2, TrendingUp, FileText } from 'lucide-react'

const trustBadges = [
  'Einmalige Zahlung',
  'KI-gestützt',
  'Kein Makler nötig',
]

function PropertyMockup() {
  return (
    <div className="relative w-full max-w-[460px] mx-auto lg:mx-0">
      {/* Main card */}
      <div className="bg-white rounded-[20px] border border-[#DDDDDD] shadow-hover overflow-hidden">
        {/* Property image */}
        <div className="relative h-52">
          <Image
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&auto=format&fit=crop&q=80"
            alt="Modernes Einfamilienhaus – Beispiel-Inserat"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 460px"
            priority
          />
          {/* Status badge */}
          <div className="absolute top-4 left-4 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-accent px-3 py-1 text-white text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
              Aktiv
            </span>
          </div>
          {/* Price tag */}
          <div className="absolute top-4 right-4 z-10 bg-white rounded-[10px] px-3 py-1.5 shadow-card">
            <span className="text-[15px] font-bold text-text-primary">485.000 €</span>
          </div>
          {/* Bottom info bar */}
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm px-4 py-2.5 flex gap-4">
            <span className="text-[12px] font-semibold text-text-secondary">120 m²</span>
            <span className="text-[12px] font-semibold text-text-secondary">4 Zi.</span>
            <span className="text-[12px] font-semibold text-text-secondary">Baujahr 1998</span>
          </div>
        </div>

        {/* Card body */}
        <div className="p-5">
          <p className="text-[15px] font-semibold text-text-primary mb-1">Einfamilienhaus in München</p>
          <p className="text-[13px] font-medium text-text-secondary mb-4">Bogenhausen · Ruhige Lage</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface rounded-[10px] p-3 text-center">
              <p className="text-[18px] font-bold text-accent">12</p>
              <p className="text-[11px] font-medium text-text-tertiary">Anfragen</p>
            </div>
            <div className="bg-surface rounded-[10px] p-3 text-center">
              <p className="text-[18px] font-bold text-text-primary">4</p>
              <p className="text-[11px] font-medium text-text-tertiary">Termine</p>
            </div>
            <div className="bg-surface rounded-[10px] p-3 text-center">
              <p className="text-[18px] font-bold text-text-primary">847</p>
              <p className="text-[11px] font-medium text-text-tertiary">Aufrufe</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating KI badge */}
      <div className="absolute -bottom-4 -left-4 bg-white rounded-[14px] border border-[#DDDDDD] shadow-hover px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0">
          <FileText size={16} className="text-accent" aria-hidden="true" />
        </div>
        <div>
          <p className="text-[12px] font-bold text-text-primary">KI-Exposé erstellt</p>
          <p className="text-[11px] font-medium text-text-tertiary">vor 2 Minuten · PDF ready</p>
        </div>
      </div>

      {/* Floating stats badge */}
      <div className="absolute -top-4 -right-4 bg-white rounded-[14px] border border-[#DDDDDD] shadow-hover px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0">
          <TrendingUp size={16} className="text-accent" aria-hidden="true" />
        </div>
        <div>
          <p className="text-[12px] font-bold text-accent">17.425 € gespart</p>
          <p className="text-[11px] font-medium text-text-tertiary">vs. Maklerprovision</p>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section
      className="pt-[140px] pb-[100px] md:pt-[220px] md:pb-[180px] bg-white overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <div className="container-landing">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
          {/* Left: Text */}
          <div className="flex-1 min-w-0">
            {/* H1 */}
            <h1
              id="hero-heading"
              className="text-[44px] md:text-[54px] font-bold text-text-primary leading-[1.1] headline-display mb-6"
            >
              Verkauf deine Immobilie selbst —{' '}
              <span className="text-accent">professionell,</span>{' '}
              ohne Makler.
            </h1>

            {/* Bold tagline */}
            <p className="text-[18px] font-semibold text-accent mb-3">
              Makler-Vorteile. Ohne Makler-Kosten.
            </p>

            {/* Subline */}
            <p className="text-[17px] md:text-[19px] font-medium text-text-secondary leading-relaxed mb-10">
              Mit KI-Tools, Schritt-für-Schritt-Begleitung und echtem Makler-Know-how.
              Einmal zahlen, selbst verkaufen, tausende Euro sparen.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <a
                href="#preise"
                className="inline-flex items-center justify-center rounded-pill bg-accent hover:bg-accent-hover text-white text-[16px] font-semibold px-7 py-3.5 transition-colors duration-150 min-h-[52px] active:scale-[0.98]"
              >
                Jetzt starten
              </a>
              <a
                href="#wie-es-funktioniert"
                className="inline-flex items-center justify-center rounded-pill border-[1.5px] border-[#DDDDDD] text-text-primary hover:border-accent hover:text-accent text-[16px] font-semibold px-7 py-3.5 transition-colors duration-150 min-h-[52px] active:scale-[0.98]"
              >
                So funktioniert&apos;s
              </a>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-5">
              {trustBadges.map((badge) => (
                <div
                  key={badge}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-text-secondary"
                >
                  <CheckCircle2 size={15} className="text-accent flex-shrink-0" aria-hidden="true" />
                  {badge}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Mockup */}
          <div className="flex-shrink-0 w-full lg:w-auto lg:max-w-[460px] hidden md:block">
            <PropertyMockup />
          </div>
        </div>
      </div>
    </section>
  )
}
