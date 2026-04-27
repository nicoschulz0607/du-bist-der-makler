'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'
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

function getPasswordStrength(pw: string): 1 | 2 | 3 {
  const hasSpecialOrDigit = /[\d\W]/.test(pw)
  if (pw.length >= 10 && hasSpecialOrDigit) return 3
  if (pw.length >= 8) return 2
  return 1
}

const strengthMeta = [
  { label: 'Schwach', color: '#C13515' },
  { label: 'Mittel', color: '#C07000' },
  { label: 'Stark', color: '#1B6B45' },
]

const inputBase =
  'w-full rounded-[8px] border px-4 min-h-[52px] text-[15px] font-medium text-text-primary bg-white outline-none transition-all duration-200 placeholder:text-text-tertiary focus:ring-2 focus:ring-accent focus:border-transparent'

export default function RegisterForm() {
  const [vorname, setVorname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const strength = password ? getPasswordStrength(password) : null
  const meta = strength ? strengthMeta[strength - 1] : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.')
      return
    }
    if (!agreeTerms) {
      setError('Bitte akzeptiere die AGB und Datenschutzerklärung.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { vorname } },
    })

    setLoading(false)
    if (authError) {
      if (
        authError.message.toLowerCase().includes('already registered') ||
        authError.message.toLowerCase().includes('already exists') ||
        authError.message.toLowerCase().includes('user already')
      ) {
        setError('already_registered')
      } else {
        setError(authError.message)
      }
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="flex justify-center mb-6">
          <CheckCircle2
            size={64}
            className="text-accent"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
        <h2
          className="text-[26px] font-bold text-text-primary mb-3"
          style={{ letterSpacing: '-0.44px' }}
        >
          Fast geschafft!
        </h2>
        <p className="text-[15px] font-medium text-text-secondary leading-relaxed mb-5">
          Wir haben dir eine Bestätigungs-E-Mail geschickt. Bitte klicke auf
          den Link in der E-Mail, um dein Konto zu aktivieren.
        </p>
        <p className="text-[13px] font-medium text-text-tertiary">
          Keine E-Mail erhalten? Prüfe deinen Spam-Ordner.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1
        className="text-[28px] font-bold text-text-primary mb-2"
        style={{ letterSpacing: '-0.44px' }}
      >
        Konto erstellen
      </h1>
      <p className="text-[15px] font-medium text-text-secondary mb-8">
        Starte deinen Immobilienverkauf noch heute.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Error banner */}
        {error && error !== 'already_registered' && (
          <div className="rounded-[8px] bg-[#FEF2F2] border border-error px-4 py-3">
            <p className="text-[14px] font-medium text-error">{error}</p>
          </div>
        )}
        {error === 'already_registered' && (
          <div className="rounded-[8px] bg-[#FEF2F2] border border-error px-4 py-3">
            <p className="text-[14px] font-medium text-error">
              Diese E-Mail ist bereits registriert.{' '}
              <Link href="/login" className="font-semibold underline">
                Jetzt einloggen
              </Link>
            </p>
          </div>
        )}

        {/* Vorname */}
        <div>
          <label
            htmlFor="vorname"
            className="block text-[13px] font-semibold text-text-primary mb-1.5"
          >
            Vorname
          </label>
          <input
            id="vorname"
            type="text"
            autoComplete="given-name"
            value={vorname}
            onChange={(e) => setVorname(e.target.value)}
            placeholder="Max"
            required
            className={`${inputBase} border-[#DDDDDD]`}
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="reg-email"
            className="block text-[13px] font-semibold text-text-primary mb-1.5"
          >
            E-Mail
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="deine@email.de"
            required
            className={`${inputBase} border-[#DDDDDD]`}
          />
        </div>

        {/* Password + strength */}
        <div>
          <label
            htmlFor="reg-password"
            className="block text-[13px] font-semibold text-text-primary mb-1.5"
          >
            Passwort
          </label>
          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
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
              aria-label={
                showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'
              }
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Strength bars */}
          {strength && meta && (
            <div className="mt-2 space-y-1.5">
              <div className="flex gap-1.5" aria-label={`Passwortstärke: ${meta.label}`}>
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className="h-1 flex-1 rounded-full transition-all duration-200"
                    style={{
                      backgroundColor:
                        strength >= level ? meta.color : '#DDDDDD',
                    }}
                  />
                ))}
              </div>
              <p
                className="text-[12px] font-semibold"
                style={{ color: meta.color }}
              >
                {meta.label}
              </p>
            </div>
          )}
          <p className="mt-1.5 text-[12px] font-medium text-text-tertiary">
            Mindestens 8 Zeichen
          </p>
        </div>

        {/* Terms */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-[#DDDDDD] accent-[#1B6B45] flex-shrink-0"
          />
          <span className="text-[14px] font-medium text-text-secondary leading-relaxed">
            Ich akzeptiere die{' '}
            <Link href="/agb" className="text-accent hover:underline">
              AGB
            </Link>{' '}
            und die{' '}
            <Link href="/datenschutz" className="text-accent hover:underline">
              Datenschutzerklärung
            </Link>
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-pill bg-accent hover:bg-accent-hover text-white text-[15px] font-semibold px-6 min-h-[52px] transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {loading && <Spinner />}
          {loading ? 'Konto wird erstellt…' : 'Konto erstellen'}
        </button>
      </form>

      <p className="mt-6 text-center text-[14px] font-medium text-text-secondary">
        Bereits registriert?{' '}
        <Link href="/login" className="text-accent font-semibold hover:underline">
          Einloggen
        </Link>
      </p>
    </div>
  )
}
