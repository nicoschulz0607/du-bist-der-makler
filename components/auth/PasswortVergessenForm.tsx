'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

const inputBase =
  'w-full rounded-[8px] border px-4 min-h-[52px] text-[15px] font-medium text-text-primary bg-white outline-none transition-all duration-200 placeholder:text-text-tertiary focus:ring-2 focus:ring-accent focus:border-transparent'

export default function PasswortVergessenForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/login?reset=success`,
    })
    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <h2
          className="text-[26px] font-bold text-text-primary mb-3"
          style={{ letterSpacing: '-0.44px' }}
        >
          E-Mail verschickt
        </h2>
        <p className="text-[15px] font-medium text-text-secondary leading-relaxed mb-6">
          Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Reset-Link
          geschickt. Prüfe auch deinen Spam-Ordner.
        </p>
        <Link
          href="/login"
          className="text-[14px] font-semibold text-accent hover:underline"
        >
          ← Zurück zum Login
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1
        className="text-[28px] font-bold text-text-primary mb-2"
        style={{ letterSpacing: '-0.44px' }}
      >
        Passwort zurücksetzen
      </h1>
      <p className="text-[15px] font-medium text-text-secondary mb-8">
        Gib deine E-Mail-Adresse ein. Wir schicken dir einen Reset-Link.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label
            htmlFor="reset-email"
            className="block text-[13px] font-semibold text-text-primary mb-1.5"
          >
            E-Mail
          </label>
          <input
            id="reset-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="deine@email.de"
            required
            className={`${inputBase} border-[#DDDDDD]`}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-pill bg-accent hover:bg-accent-hover text-white text-[15px] font-semibold px-6 min-h-[52px] transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {loading && <Spinner />}
          {loading ? 'Wird gesendet…' : 'Reset-Link senden'}
        </button>
      </form>

      <p className="mt-6 text-center text-[14px] font-medium text-text-secondary">
        <Link
          href="/login"
          className="text-text-tertiary hover:text-text-secondary transition-colors duration-150"
        >
          ← Zurück zum Login
        </Link>
      </p>
    </div>
  )
}
