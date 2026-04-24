import { ArrowRight, CheckCircle } from 'lucide-react'

const bullets = [
  'Kein Abo, keine Provision',
  'In 10 Minuten startklar',
  'KI-Tools inklusive',
]

export default function ClosingCTA() {
  return (
    <section
      id="registrieren"
      className="section-padding bg-white"
      aria-labelledby="cta-heading"
    >
      <div className="container-landing">
        <div className="bg-accent rounded-[24px] overflow-hidden relative">
          {/* Decorative circles */}
          <div
            className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-20 right-40 w-96 h-96 rounded-full bg-white/5 pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute top-8 right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative flex flex-col lg:flex-row items-center gap-12 px-8 py-16 md:px-16 md:py-20">
            {/* Left: Text */}
            <div className="flex-1 text-center lg:text-left">
              <h2
                id="cta-heading"
                className="text-[32px] md:text-[40px] font-bold text-white leading-tight headline-section mb-4"
              >
                Bereit, deinen Verkauf selbst in die Hand zu nehmen?
              </h2>
              <p className="text-[17px] font-medium text-white/80 mb-8 max-w-[460px] mx-auto lg:mx-0">
                Starte jetzt und spare tausende Euro Maklercourtage. Einmal zahlen, selbst verkaufen.
              </p>

              {/* Bullets */}
              <ul className="flex flex-col sm:flex-row lg:flex-col gap-2 mb-10 items-center lg:items-start">
                {bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-[14px] font-semibold text-white/90">
                    <CheckCircle size={16} className="text-white/70 flex-shrink-0" aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>

              <a
                href="#preise"
                className="inline-flex items-center gap-2 rounded-pill bg-white hover:bg-white/90 text-accent text-[16px] font-bold px-8 py-4 transition-colors duration-150 min-h-[52px] active:scale-[0.98]"
              >
                Kostenlos starten
                <ArrowRight size={18} aria-hidden="true" />
              </a>
            </div>

            {/* Right: Visual mockup */}
            <div className="flex-shrink-0 hidden lg:flex flex-col gap-4 w-[280px]">
              {/* Mini stats card */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-[16px] p-5">
                <p className="text-white/60 text-[11px] font-bold uppercase tracking-wider mb-3">Dein Ergebnis</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 text-[13px] font-medium">Verkaufspreis</span>
                    <span className="text-white text-[14px] font-bold">485.000 €</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 text-[13px] font-medium">Paket Pro</span>
                    <span className="text-white text-[14px] font-bold">− 499 €</span>
                  </div>
                  <div className="border-t border-white/20 pt-3 flex justify-between items-center">
                    <span className="text-white/80 text-[13px] font-medium">Ersparnis vs. Makler</span>
                    <span className="text-white text-[15px] font-bold">+ 17.351 €</span>
                  </div>
                </div>
              </div>

              {/* Timeline card */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-[16px] p-5">
                <p className="text-white/60 text-[11px] font-bold uppercase tracking-wider mb-3">Zeitplan</p>
                <div className="space-y-2.5">
                  {[
                    { label: 'Paket gewählt', done: true },
                    { label: 'Exposé erstellt', done: true },
                    { label: 'Inserat live', done: true },
                    { label: 'Käufer gefunden', done: false },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2.5">
                      <div className={[
                        'w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center',
                        item.done ? 'bg-white' : 'border border-white/40',
                      ].join(' ')} aria-hidden="true">
                        {item.done && (
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <path d="M1 3L3 5L7 1" stroke="#1B6B45" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className={[
                        'text-[13px] font-medium',
                        item.done ? 'text-white' : 'text-white/50',
                      ].join(' ')}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
