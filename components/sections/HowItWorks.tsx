const steps = [
  {
    number: 1,
    title: 'Paket wählen',
    description:
      'Wähle das Paket, das zu deinem Verkauf passt. Ab 299 € einmalig — kein Abo, keine Provision.',
  },
  {
    number: 2,
    title: 'Inserat erstellen',
    description:
      'Lade Fotos hoch, fülle das Formular aus — die KI erstellt dein professionelles Exposé in Minuten.',
  },
  {
    number: 3,
    title: 'Verkaufen & sparen',
    description:
      'Interessenten verwalten, Besichtigungen planen, sicher zum Notar gehen. Du behältst die Kontrolle.',
  },
]

export default function HowItWorks() {
  return (
    <section
      id="wie-es-funktioniert"
      className="section-padding bg-surface"
      aria-labelledby="how-heading"
    >
      <div className="container-landing">
        {/* Header */}
        <div className="text-center mb-20">
          <h2
            id="how-heading"
            className="text-[36px] md:text-[42px] font-bold text-text-primary headline-section mb-4"
          >
            So funktioniert&apos;s
          </h2>
          <p className="text-[17px] font-medium text-text-secondary max-w-[480px] mx-auto">
            In drei Schritten zum erfolgreichen Immobilienverkauf — ohne Makler.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 relative">
          {steps.map((step, index) => (
            <div key={step.number} className="relative flex flex-col items-center text-center px-8">
              {/* Connector line between circles (desktop) */}
              {index < steps.length - 1 && (
                <div
                  className="hidden md:block absolute top-[28px] left-1/2 w-full h-[1px] border-t-2 border-dashed border-[#DDDDDD] z-0"
                  style={{ left: 'calc(50% + 28px)', right: 'calc(-50% + 28px)', width: 'calc(100% - 56px)' }}
                  aria-hidden="true"
                />
              )}

              {/* Step circle */}
              <div
                className="relative z-10 w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white text-[20px] font-bold flex-shrink-0 mb-8 shadow-[0_0_0_8px_#E8F5EE]"
                aria-hidden="true"
              >
                {step.number}
              </div>

              {/* Step label */}
              <div className="mb-1">
                <span className="text-[11px] font-bold text-accent uppercase tracking-widest">
                  Schritt {step.number}
                </span>
              </div>

              <h3 className="text-[20px] font-bold text-text-primary mb-3 headline-sub">
                {step.title}
              </h3>
              <p className="text-[14px] font-medium text-text-secondary leading-relaxed max-w-[260px]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
