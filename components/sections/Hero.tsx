import Image from 'next/image'
import { CheckCircle2, Sparkles, Users, BarChart2, TrendingUp } from 'lucide-react'

const trustBadges = ['Einmalige Zahlung', 'KI-gestützt', 'Kein Makler nötig']

const annotations = [
  { icon: <Sparkles size={11} className="text-[#1B6B45]" />, label: 'KI-Exposé',    topPct: '16%' },
  { icon: <Users    size={11} className="text-[#1B6B45]" />, label: 'Live CRM',     topPct: '48%' },
  { icon: <BarChart2 size={11} className="text-[#1B6B45]" />, label: 'Statistiken', topPct: '82%' },
]

function PropertyMockup() {
  return (
    <div className="relative w-full max-w-[460px] mx-auto lg:mx-0">

      {/* Hauptkarte */}
      <div className="relative bg-white border border-[#DDDDDD] rounded-2xl shadow-xl overflow-visible">

        {/* overflow-hidden nur für Bild-Clipping */}
        <div className="overflow-hidden rounded-2xl">

          {/* Bild */}
          <div className="relative h-[195px]">
            <Image
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=700&auto=format&fit=crop&q=80"
              alt="Beispiel-Inserat"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 460px"
              priority
            />
            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-[#1B6B45] px-2.5 py-1 text-white text-[10px] font-bold z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Aktiv
            </span>
            <div className="absolute top-4 right-4 bg-white rounded-[10px] px-3 py-1.5 shadow-card z-10">
              <span className="text-[15px] font-bold text-text-primary">485.000 €</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm px-4 py-2.5 flex gap-4">
              <span className="text-[12px] font-semibold text-text-secondary">120 m²</span>
              <span className="text-[12px] font-semibold text-text-secondary">4 Zi.</span>
              <span className="text-[12px] font-semibold text-text-secondary">Baujahr 1998</span>
            </div>
          </div>

          {/* Body */}
          <div className="p-5">
            <p className="text-[15px] font-semibold text-text-primary mb-0.5">Einfamilienhaus in München</p>
            <p className="text-[13px] text-gray-400 mb-4">Bogenhausen · Ruhige Lage</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                ['12',  'Anfragen', 'text-accent'],
                ['4',   'Termine',  'text-text-primary'],
                ['847', 'Aufrufe',  'text-text-primary'],
              ].map(([n, label, color]) => (
                <div key={label} className="bg-surface rounded-[10px] p-3 text-center">
                  <p className={`text-[18px] font-bold ${color}`}>{n}</p>
                  <p className="text-[11px] font-medium text-text-tertiary">{label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>


      </div>

      {/* Annotation-Rail — direkt rechts an der Karte, nur Desktop */}
      <div className="hidden lg:block absolute left-full top-0 bottom-0">
        {annotations.map(({ icon, label, topPct }) => (
          <div
            key={label}
            className="absolute flex items-center"
            style={{ top: topPct, transform: 'translateY(-50%)' }}
          >
            <div className="w-5 border-t border-dashed border-gray-300 flex-shrink-0" />
            <div className="flex items-center gap-1.5 bg-white border border-[#EEEEEE] rounded-lg px-2.5 py-1.5 shadow-sm whitespace-nowrap">
              {icon}
              <span className="text-[11px] font-semibold text-text-primary">{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: Annotation-Tags */}
      <div className="flex flex-wrap gap-2 mt-6 lg:hidden">
        {annotations.map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 bg-[#F9FAFB] border border-[#EEEEEE] rounded-lg px-2.5 py-1.5">
            {icon}
            <span className="text-[11px] font-semibold text-text-primary">{label}</span>
          </div>
        ))}
      </div>

    </div>
  )
}

export default function Hero() {
  return (
    <section
      className="min-h-screen flex items-center bg-white overflow-x-clip"
      aria-labelledby="hero-heading"
    >
      <div className="container-landing w-full py-24">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">

          {/* Linke Spalte: Text */}
          <div className="flex-1 min-w-0">
            <h1
              id="hero-heading"
              className="text-[44px] md:text-[54px] font-bold text-text-primary leading-[1.1] headline-display mb-6"
            >
              Verkauf deine Immobilie selbst —{' '}
              <span className="text-accent">professionell,</span>{' '}
              ohne Makler.
            </h1>
            <p className="text-[18px] font-semibold text-accent mb-3">
              Makler-Vorteile. Ohne Makler-Kosten.
            </p>
            <p className="text-[17px] md:text-[19px] font-medium text-text-secondary leading-relaxed mb-10">
              Mit KI-Tools, Schritt-für-Schritt-Begleitung und echtem Makler-Know-how.
              Einmal zahlen, selbst verkaufen, tausende Euro sparen.
            </p>
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
            <div className="flex flex-wrap gap-5">
              {trustBadges.map((badge) => (
                <div key={badge} className="flex items-center gap-1.5 text-[13px] font-semibold text-text-secondary">
                  <CheckCircle2 size={15} className="text-accent flex-shrink-0" aria-hidden="true" />
                  {badge}
                </div>
              ))}
            </div>
          </div>

          {/* Rechte Spalte: Mockup */}
          <div className="flex-shrink-0 w-full lg:w-auto lg:max-w-[460px]">
            <PropertyMockup />
            <div className="mt-5 flex items-center gap-4 bg-[#E8F5EE] border border-[#1B6B45]/20 rounded-2xl px-5 py-4">
              <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <TrendingUp size={20} className="text-[#1B6B45]" />
              </div>
              <div>
                <p className="text-[22px] font-bold text-[#1B6B45] leading-none mb-1">17.425 € gespart</p>
                <p className="text-[13px] text-[#1B6B45]/70">vs. Maklerprovision · bei 485.000 € Verkaufspreis</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
