'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

const inputBase =
  'w-full rounded-[8px] border px-4 min-h-[52px] text-[15px] font-medium text-text-primary bg-white outline-none transition-all duration-200 placeholder:text-text-tertiary focus:ring-2 focus:ring-accent focus:border-transparent'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<'generic' | 'email_not_confirmed' | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendDone, setResendDone] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const tierParam = searchParams.get('tier')
  const laufzeitParam = searchParams.get('laufzeit')
  const addonParam = searchParams.get('addon') as 'toolpaket' | 'maklerstunde' | null

  // Build pass-through href for the register link
  const registerHref = (() => {
    const p = new URLSearchParams()
    if (tierParam) p.set('tier', tierParam)
    if (laufzeitParam) p.set('laufzeit', laufzeitParam)
    if (addonParam) p.set('addon', addonParam)
    const qs = p.toString()
    return qs ? `/registrieren?${qs}` : '/registrieren'
  })()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setLoading(false)
      if (authError.message.includes('Email not confirmed')) {
        setError('email_not_confirmed')
      } else {
        setError('generic')
      }
      return
    }

    // After successful login: trigger pending checkout if params are present
    const validTiers = ['basic', 'pro', 'premium']
    const validLaufzeiten = [1, 3, 6]

    if (tierParam && laufzeitParam) {
      const laufzeit = parseInt(laufzeitParam, 10)
      if (validTiers.includes(tierParam) && validLaufzeiten.includes(laufzeit)) {
        try {
          const res = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Confirm-Paketwechsel': 'true',
            },
            body: JSON.stringify({ kind: 'paket', tier: tierParam, laufzeit }),
          })
          if (res.ok) {
            const data = await res.json()
            window.location.href = data.url
            return
          }
        } catch {
          // fall through to dashboard on network error
        }
      }
    } else if (addonParam && ['toolpaket', 'maklerstunde'].includes(addonParam)) {
      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'addon', addon_type: addonParam }),
        })
        if (res.ok) {
          const data = await res.json()
          window.location.href = data.url
          return
        }
      } catch {
        // fall through to dashboard on network error
      }
    }

    router.push('/dashboard')
  }

  async function handleResend() {
    setResendLoading(true)
    const supabase = createClient()
    await supabase.auth.resend({ type: 'signup', email })
    setResendLoading(false)
    setResendDone(true)
  }

  return (
    <div>
      <h1
        className="text-[28px] font-bold text-text-primary mb-2"
        style={{ letterSpacing: '-0.44px' }}
      >
        Willkommen zurück
      </h1>
      <p className="text-[15px] font-medium text-text-secondary mb-8">
        Logge dich ein, um fortzufahren.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Error banner */}
        {error === 'generic' && (
          <div className="rounded-[8px] bg-[#FEF2F2] border border-error px-4 py-3">
            <p className="text-[14px] font-semibold text-error">
              Login fehlgeschlagen — bitte E-Mail und Passwort prüfen.
            </p>
          </div>
        )}
        {error === 'email_not_confirmed' && (
          <div className="rounded-[8px] bg-[#FEF2F2] border border-error px-4 py-3 space-y-1.5">
            <p className="text-[14px] font-semibold text-error">
              Bitte bestätige deine E-Mail.
            </p>
            <p className="text-[12px] font-medium text-text-secondary">
              Den Bestätigungslink findest du in deinem Postfach.{' '}
              {!resendDone ? (
                <>
                  Keine Mail erhalten?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="text-accent hover:underline font-semibold disabled:opacity-70"
                  >
                    {resendLoading ? 'Wird gesendet…' : 'Erneut senden'}
                  </button>
                </>
              ) : (
                'Wir haben dir eine neue E-Mail geschickt.'
              )}
            </p>
          </div>
        )}

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-[13px] font-semibold text-text-primary mb-1.5"
          >
            E-Mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="deine@email.de"
            required
            className={`${inputBase} border-[#DDDDDD]`}
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="text-[13px] font-semibold text-text-primary"
            >
              Passwort
            </label>
            <Link
              href="/passwort-vergessen"
              className="text-[12px] font-medium text-text-tertiary hover:text-text-secondary transition-colors duration-150"
            >
              Passwort vergessen?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={`${inputBase} border-[#DDDDDD] pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors duration-150 p-1"
              aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-[#DDDDDD] accent-[#1B6B45]"
          />
          <span className="text-[14px] font-medium text-text-secondary">
            Angemeldet bleiben
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-pill bg-accent hover:bg-accent-hover text-white text-[15px] font-semibold px-6 min-h-[52px] transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {loading && <Spinner />}
          {loading ? 'Wird eingeloggt…' : 'Einloggen'}
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-[#DDDDDD]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-[14px] font-semibold text-text-secondary">
              Noch kein Konto?
            </span>
          </div>
        </div>

        {/* Register-Section */}
        <Link
          href={registerHref}
          className="w-full inline-flex items-center justify-center rounded-pill border-2 border-[#1B6B45] text-[#1B6B45] text-[14px] font-semibold px-6 min-h-[44px] hover:bg-[#1B6B45]/5 transition-colors duration-200"
        >
          Jetzt registrieren →
        </Link>
      </form>
    </div>
  )
}
