'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getTierLabel, type Tier } from '@/lib/tier'

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

const inputBase =
  'w-full rounded-[8px] border px-4 min-h-[52px] text-[15px] font-medium text-text-primary bg-white outline-none transition-all duration-200 placeholder:text-text-tertiary focus:ring-2 focus:ring-accent focus:border-transparent'

const labelBase = 'block text-[13px] font-semibold text-text-primary mb-1.5'

export default function EinstellungenPage() {
  const router = useRouter()
  const supabase = createClient()

  const [vorname, setVorname] = useState('')
  const [email, setEmail] = useState('')
  const [tier, setTier] = useState<Tier>(null)
  const [createdAt, setCreatedAt] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loadingName, setLoadingName] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setEmail(user.email ?? '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('vorname, paket_tier, created_at')
        .eq('id', user.id)
        .single()

      if (profile) {
        setVorname(profile.vorname ?? '')
        setTier(profile.paket_tier as Tier)
        setCreatedAt(profile.created_at)
      }
    }
    load()
  }, [])

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    setNameError(null)
    setNameSuccess(false)
    setLoadingName(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingName(false); return }

    const { error } = await supabase
      .from('profiles')
      .update({ vorname })
      .eq('id', user.id)

    setLoadingName(false)
    if (error) {
      setNameError('Fehler beim Speichern. Bitte versuche es erneut.')
    } else {
      setNameSuccess(true)
      setTimeout(() => setNameSuccess(false), 3000)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (newPassword.length < 8) {
      setPasswordError('Das Passwort muss mindestens 8 Zeichen lang sein.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Die Passwörter stimmen nicht überein.')
      return
    }

    setLoadingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoadingPassword(false)

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const expiresAt = createdAt
    ? new Date(new Date(createdAt).getTime() + 180 * 24 * 60 * 60 * 1000)
    : null

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-[22px] font-bold text-text-primary mb-1" style={{ letterSpacing: '-0.18px' }}>
          Einstellungen
        </h1>
        <p className="text-[14px] text-text-secondary">Verwalte dein Konto und deine Zugangsdaten.</p>
      </div>

      {/* Profil */}
      <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
        <h2 className="text-[15px] font-bold text-text-primary mb-5">Profil</h2>
        <form onSubmit={handleSaveName} className="space-y-4">
          {nameError && (
            <div className="rounded-[8px] bg-[#FEF2F2] border border-error px-4 py-3">
              <p className="text-[13px] font-medium text-error">{nameError}</p>
            </div>
          )}
          {nameSuccess && (
            <div className="rounded-[8px] bg-[#E8F5EE] border border-accent px-4 py-3">
              <p className="text-[13px] font-medium text-accent">Vorname gespeichert.</p>
            </div>
          )}
          <div>
            <label className={labelBase}>Vorname</label>
            <input
              type="text"
              value={vorname}
              onChange={(e) => setVorname(e.target.value)}
              className={`${inputBase} border-[#DDDDDD]`}
              placeholder="Dein Vorname"
            />
          </div>
          <div>
            <label className={labelBase}>E-Mail</label>
            <input
              type="email"
              value={email}
              disabled
              className={`${inputBase} border-[#DDDDDD] bg-surface opacity-70 cursor-not-allowed`}
            />
            <p className="text-[12px] text-text-tertiary mt-1">E-Mail-Änderung aktuell nicht möglich.</p>
          </div>
          <button
            type="submit"
            disabled={loadingName}
            className="inline-flex items-center gap-2 rounded-pill bg-accent hover:bg-accent-hover text-white text-[14px] font-semibold px-5 h-10 transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loadingName && <Spinner />}
            Speichern
          </button>
        </form>
      </div>

      {/* Passwort */}
      <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
        <h2 className="text-[15px] font-bold text-text-primary mb-5">Passwort ändern</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordError && (
            <div className="rounded-[8px] bg-[#FEF2F2] border border-error px-4 py-3">
              <p className="text-[13px] font-medium text-error">{passwordError}</p>
            </div>
          )}
          {passwordSuccess && (
            <div className="rounded-[8px] bg-[#E8F5EE] border border-accent px-4 py-3">
              <p className="text-[13px] font-medium text-accent">Passwort erfolgreich geändert.</p>
            </div>
          )}
          <div>
            <label className={labelBase}>Neues Passwort</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className={`${inputBase} border-[#DDDDDD]`}
              placeholder="Mindestens 8 Zeichen"
            />
          </div>
          <div>
            <label className={labelBase}>Passwort wiederholen</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className={`${inputBase} border-[#DDDDDD]`}
              placeholder="Passwort bestätigen"
            />
          </div>
          <button
            type="submit"
            disabled={loadingPassword}
            className="inline-flex items-center gap-2 rounded-pill bg-accent hover:bg-accent-hover text-white text-[14px] font-semibold px-5 h-10 transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loadingPassword && <Spinner />}
            Passwort ändern
          </button>
        </form>
      </div>

      {/* Paket & Laufzeit */}
      <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
        <h2 className="text-[15px] font-bold text-text-primary mb-4">Dein Paket</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-semibold text-text-primary">{getTierLabel(tier)}-Paket</p>
            {expiresAt && (
              <p className="text-[13px] text-text-secondary mt-0.5">
                Läuft ab am {expiresAt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            )}
          </div>
          <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${
            tier === 'premium'
              ? 'bg-amber-100 text-amber-700'
              : tier === 'pro'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-accent-light text-accent'
          }`}>
            {getTierLabel(tier)}
          </span>
        </div>
      </div>

      {/* Konto-Aktionen */}
      <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 space-y-3">
        <h2 className="text-[15px] font-bold text-text-primary mb-4">Konto</h2>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full inline-flex items-center justify-center rounded-pill border-2 border-[#222222] hover:bg-surface text-text-primary text-[14px] font-semibold px-5 h-10 transition-colors duration-150"
        >
          Ausloggen
        </button>
        <p className="text-[12px] text-text-tertiary text-center">
          Konto löschen?{' '}
          <a href="mailto:hallo@du-bist-der-makler.de" className="text-accent hover:underline font-medium">
            Kontaktiere uns
          </a>
        </p>
      </div>
    </div>
  )
}
