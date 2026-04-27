'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

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
        setError('Bitte bestätige zuerst deine E-Mail-Adresse.')
      } else {
        setError('E-Mail oder Passwort falsch.')
      }
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user?.user_metadata?.paket_tier) {
      router.push('/dashboard')
    } else {
      router.push('/onboarding')
    }
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
        {error && (
          <div className="rounded-[8px] bg-[#FEF2F2] border border-error px-4 py-3">
            <p className="text-[14px] font-medium text-error">{error}</p>
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
              className="text-[12px] font-medium text-text-secondary hover:text-accent transition-colors duration-150"
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
      </form>

      <p className="mt-6 text-center text-[14px] font-medium text-text-secondary">
        Noch kein Konto?{' '}
        <Link
          href="/registrieren"
          className="text-accent font-semibold hover:underline"
        >
          Jetzt registrieren
        </Link>
      </p>
    </div>
  )
}
