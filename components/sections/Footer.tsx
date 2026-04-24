const footerLinks = {
  Produkt: [
    { label: 'Basic – 399 €', href: '#preise' },
    { label: 'Pro – 599 €', href: '#preise' },
    { label: 'Premium – 799 €', href: '#preise' },
    { label: 'Alle Features', href: '#features' },
  ],
  Hilfe: [
    { label: 'So funktioniert\'s', href: '#wie-es-funktioniert' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Makler-Stunde buchen', href: '#registrieren' },
    { label: 'Kontakt', href: 'mailto:hallo@du-bist-der-makler.de' },
  ],
  Rechtliches: [
    { label: 'Impressum', href: '/impressum' },
    { label: 'Datenschutz', href: '/datenschutz' },
    { label: 'AGB', href: '/agb' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-[#DDDDDD]">
      <div className="container-landing py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-3 h-3 rounded-full bg-accent flex-shrink-0" aria-hidden="true" />
              <span className="text-[15px] font-semibold text-text-primary">
                du bist der makler
              </span>
            </div>
            <p className="text-[14px] font-medium text-text-secondary leading-relaxed max-w-[280px] mb-6">
              Die Plattform für den professionellen Privatverkauf. KI-Tools, Makler-Know-how, kein Abo.
            </p>
            <div className="inline-flex items-center gap-2 rounded-pill bg-accent-light border border-accent/20 px-4 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
              <span className="text-[12px] font-semibold text-accent">Beta – jetzt einsteigen</span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-[11px] font-bold text-text-primary uppercase tracking-widest mb-5">
                {heading}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#DDDDDD]">
        <div className="container-landing py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] font-medium text-text-secondary">
            © 2026 du-bist-der-makler.de — Alle Rechte vorbehalten
          </p>
          <p className="text-[12px] font-medium text-text-secondary">
            Gebaut in Deutschland 🇩🇪
          </p>
        </div>
      </div>
    </footer>
  )
}
