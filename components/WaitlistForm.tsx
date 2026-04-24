'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle } from 'lucide-react'

export default function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    // Simulate async — no backend yet
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 600)
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-3 text-accent font-medium text-[15px]" role="status" aria-live="polite">
        <CheckCircle size={20} className="flex-shrink-0" aria-hidden="true" />
        <span>Du bist auf der Liste! Wir melden uns.</span>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
      aria-label="Warteliste – E-Mail eintragen"
      noValidate
    >
      <label htmlFor="waitlist-email" className="sr-only">
        E-Mail-Adresse
      </label>
      <input
        id="waitlist-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="deine@email.de"
        required
        autoComplete="email"
        className="flex-1 rounded-pill border border-[#DDDDDD] bg-white px-5 py-3 text-[15px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-150 min-h-[48px]"
      />
      <button
        type="submit"
        disabled={loading || !email}
        className="inline-flex items-center justify-center gap-2 rounded-pill bg-accent hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-[15px] font-semibold px-6 py-3 transition-colors duration-150 min-h-[48px] flex-shrink-0 active:scale-[0.98]"
        aria-busy={loading}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
        ) : (
          <>
            Auf die Warteliste
            <ArrowRight size={16} aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  )
}
