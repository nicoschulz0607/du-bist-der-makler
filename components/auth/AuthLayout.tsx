import type { ReactNode } from 'react'
import Link from 'next/link'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Left Panel — Desktop only */}
      <div className="hidden md:flex flex-col w-[45%] bg-accent relative overflow-hidden">
        {/* Background house silhouette */}
        <div
          className="absolute bottom-0 right-[-40px] w-[560px] h-[460px] pointer-events-none"
          style={{ opacity: 0.08 }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 560 460" fill="none">
            <path
              d="M280 40L40 200H100V420H230V290H330V420H460V200H520L280 40Z"
              fill="white"
            />
            <rect x="230" y="290" width="100" height="130" fill="white" />
            <rect x="110" y="240" width="80" height="100" fill="white" />
            <rect x="370" y="240" width="80" height="100" fill="white" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10 p-10">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="w-3 h-3 rounded-full bg-white/80 group-hover:bg-white transition-colors duration-150" />
            <span className="text-[15px] font-semibold text-white">
              du bist der makler
            </span>
          </Link>
        </div>

        {/* Quote — centered */}
        <div className="relative z-10 flex-1 flex flex-col items-start justify-center px-12">
          <blockquote className="text-[34px] font-bold text-white leading-[1.15] mb-6" style={{ letterSpacing: '-0.44px' }}>
            "Du zahlst einmal.<br />Du verkaufst selbst."
          </blockquote>
          <p className="text-[16px] font-medium text-white/70 max-w-[300px] leading-relaxed">
            Professionell verkaufen ohne Makler — mit KI-Tools und echtem Makler-Know-how.
          </p>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 p-10">
          <div className="flex gap-1 mb-3" aria-label="5 von 5 Sternen">
            {[...Array(5)].map((_, i) => (
              <svg key={i} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M8 1l1.97 4.01L14.5 5.63l-3.25 3.17.77 4.44L8 11.01l-4.02 2.23.77-4.44L1.5 5.63l4.53-.62L8 1z"
                  fill="#FFC107"
                />
              </svg>
            ))}
          </div>
          <p className="text-[14px] font-medium text-white/80 mb-2 leading-relaxed">
            "Innerhalb von 3 Wochen verkauft. Die KI-Tools haben mir enorm geholfen."
          </p>
          <p className="text-[13px] font-semibold text-white/50">
            Michael R. · München
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col bg-white overflow-y-auto">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-6 py-4 border-b border-[#DDDDDD]">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent" aria-hidden="true" />
            <span className="text-[14px] font-semibold text-text-primary">
              du bist der makler
            </span>
          </Link>
          <Link
            href="/"
            className="text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            ← Zur Startseite
          </Link>
        </div>

        {/* Form slot */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </div>
    </div>
  )
}
