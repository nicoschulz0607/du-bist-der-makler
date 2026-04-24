export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#EEEEEE]">
      <div className="container-landing">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group" aria-label="du bist der makler – Startseite">
            <span
              className="w-3 h-3 rounded-full bg-accent flex-shrink-0"
              aria-hidden="true"
            />
            <span className="text-[15px] font-semibold text-text-primary tracking-tight">
              du bist der makler
            </span>
          </a>

          {/* Nav links — desktop */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Hauptnavigation">
            <a
              href="#wie-es-funktioniert"
              className="text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
            >
              So funktioniert&apos;s
            </a>
            <a
              href="#preise"
              className="text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
            >
              Preise
            </a>
            <a
              href="#faq"
              className="text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
            >
              FAQ
            </a>
          </nav>

          {/* CTA */}
          <a
            href="#registrieren"
            className="inline-flex items-center justify-center rounded-pill bg-accent hover:bg-accent-hover text-white text-[14px] font-semibold px-5 py-2.5 transition-colors duration-150 min-h-[44px]"
          >
            Jetzt starten
          </a>
        </div>
      </div>
    </header>
  )
}
