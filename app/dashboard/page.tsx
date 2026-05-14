import Link from 'next/link'
import {
  Home,
  ArrowRight,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { canAccess, getUpgradeTarget, getUpgradeText, type Tier } from '@/lib/tier'
import { CHECKLIST } from '@/lib/checklist'
import SmartCTACard from '@/components/dashboard/SmartCTACard'
import OnboardingModal from '@/components/wizard/OnboardingModal'
import ReentryBanner from '@/components/wizard/ReentryBanner'
import { getKlaraContext } from '@/lib/klara/context'
import { getPrimarySignal } from '@/lib/klara/triggers'
import { getRecentEvents } from '@/lib/activity/log'
import ActivityTimeline from '@/components/dashboard/ActivityTimeline'

function differenceInDays(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileRes, listingRes, checkRes, wizardRes] = await Promise.all([
    supabase.from('profiles').select('vorname, paket_tier, created_at, wizard_onboarding_shown, wizard_banner_dismissals').eq('id', user.id).single(),
    supabase.from('listings').select('*').eq('user_id', user.id).order('created_at').limit(1).maybeSingle(),
    supabase.from('checkliste_status').select('aufgabe_id, completed').eq('user_id', user.id),
    supabase.from('wizard_progress').select('aktuelle_station, abgeschlossen_am').eq('user_id', user.id).maybeSingle(),
  ])

  const profile = profileRes.data
  const listing = listingRes.data
  const checkItems = checkRes.data ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileRaw = profile as any
  const wizardProgress = wizardRes.data
  const showOnboarding = !(profileRaw?.wizard_onboarding_shown ?? true)
  const bannerDismissals: number = profileRaw?.wizard_banner_dismissals ?? 0
  const tier = profile?.paket_tier as Tier

  const totalItems = CHECKLIST.flatMap((p) => p.items).length
  const completedCount = checkItems.filter((i) => i.completed).length

  const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date()
  const expiresAt = new Date(createdAt.getTime() + 180 * 24 * 60 * 60 * 1000)
  const daysLeft = differenceInDays(new Date(), expiresAt)

  const upgradeInfo = getUpgradeText(tier)
  const upgradeTarget = getUpgradeTarget(tier)

  const klaraContext = await getKlaraContext(user.id)
  const primarySignal = getPrimarySignal(klaraContext)

  const recentEvents = await getRecentEvents(user.id, { limit: 7 })

  return (
    <div className="space-y-7">
      <OnboardingModal show={showOnboarding} />

      {wizardProgress && !wizardProgress.abgeschlossen_am && bannerDismissals < 3 && (
        <ReentryBanner station={wizardProgress.aktuelle_station} totalStations={12} />
      )}

      {primarySignal && (
        <SmartCTACard signal={primarySignal} />
      )}

      {/* Status-Banner */}
      {listing?.status === 'aktiv' ? (
        <div className="flex items-center justify-between gap-4 bg-white border border-[#DDDDDD] rounded-xl px-5 py-2.5">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-accent flex-shrink-0" strokeWidth={2} />
            <p className="text-[14px] font-semibold text-accent">Dein Inserat ist live!</p>
          </div>
          <Link
            href="/dashboard/objekt"
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:underline"
          >
            Ansehen <ArrowRight size={14} />
          </Link>
        </div>
      ) : listing?.status === 'draft' ? (
        <div className="flex items-center justify-between gap-4 bg-[#FFF4E0] border border-[#C07000] rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <Circle size={20} className="text-[#C07000] flex-shrink-0" strokeWidth={2} />
            <div>
              <p className="text-[15px] font-semibold text-[#C07000]">
                {completedCount} von {totalItems} Schritten abgeschlossen
              </p>
              <p className="text-[13px] text-[#C07000]/70">Schließe die Checkliste ab um dein Inserat zu aktivieren.</p>
            </div>
          </div>
          <Link
            href="/dashboard/schritte"
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#C07000] hover:underline"
          >
            Weiter <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 bg-surface border border-[#DDDDDD] rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <Home size={20} className="text-text-secondary flex-shrink-0" strokeWidth={1.75} />
            <div>
              <p className="text-[15px] font-semibold text-text-primary">Leg jetzt dein Objekt an</p>
              <p className="text-[13px] text-text-secondary">Trage deine Immobiliendaten ein und starte den Verkauf.</p>
            </div>
          </div>
          <Link
            href="/dashboard/objekt"
            className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-pill bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold px-4 h-9 transition-colors duration-150"
          >
            Jetzt anlegen <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Listing-Vorschau / Empty State */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] font-bold text-text-primary" style={{ letterSpacing: '-0.18px' }}>Mein Objekt</h2>
          <Link href="/dashboard/objekt" className="text-[13px] font-semibold text-accent hover:underline">
            {listing ? 'Bearbeiten' : 'Anlegen'} →
          </Link>
        </div>

        {listing ? (
          <Link href="/dashboard/objekt" className="block bg-white border border-[#DDDDDD] rounded-xl p-5 hover:border-accent hover:shadow-sm transition-all duration-150">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[15px] font-semibold text-text-primary">
                  {listing.objekttyp ?? 'Immobilie'}
                </p>
                {listing.adresse_strasse && (
                  <p className="text-[13px] text-text-secondary mt-0.5">
                    {listing.adresse_strasse}, {listing.adresse_plz} {listing.adresse_ort}
                  </p>
                )}
                {listing.preis && (
                  <p className="text-[18px] font-bold text-accent mt-2" style={{ letterSpacing: '-0.18px' }}>
                    {listing.preis.toLocaleString('de-DE')} €
                  </p>
                )}
              </div>
              <span className={`flex-shrink-0 text-[12px] font-semibold px-2.5 py-1 rounded-full ${
                listing.status === 'aktiv'
                  ? 'bg-[#E8F5EE] text-accent'
                  : listing.status === 'verkauft'
                  ? 'bg-surface text-text-secondary'
                  : 'bg-[#FFF4E0] text-[#C07000]'
              }`}>
                {listing.status === 'aktiv' ? 'Aktiv' : listing.status === 'verkauft' ? 'Verkauft' : 'Entwurf'}
              </span>
            </div>
          </Link>
        ) : (
          <div className="bg-white border border-[#DDDDDD] rounded-xl p-10 flex flex-col items-center text-center">
            <Home size={40} className="text-[#DDDDDD] mb-4" strokeWidth={1.5} />
            <p className="text-[15px] font-semibold text-text-primary mb-1">Noch kein Objekt angelegt</p>
            <p className="text-[13px] text-text-secondary mb-5">Trage deine Immobiliendaten ein und starte den Verkauf.</p>
            <Link
              href="/dashboard/objekt"
              className="inline-flex items-center gap-2 rounded-pill bg-accent hover:bg-accent-hover text-white text-[14px] font-semibold px-5 h-10 transition-colors duration-150"
            >
              Objekt anlegen
            </Link>
          </div>
        )}

        {listing && (
          <p className="text-[12px] text-text-tertiary mt-2">
            Laufzeit: noch {daysLeft > 0 ? daysLeft : 0} von 180 Tagen
            {daysLeft < 30 && <span className="text-[#C07000] font-semibold ml-1">(läuft bald ab)</span>}
          </p>
        )}
      </div>

      <ActivityTimeline events={recentEvents} />

      {/* Portal-Status (nur wenn aktiv) */}
      {listing?.status === 'aktiv' && (
        <div>
          <h2 className="text-[17px] font-bold text-text-primary mb-3" style={{ letterSpacing: '-0.18px' }}>Portal-Status</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'du-bist-der-makler.de', active: true },
              { label: 'ImmoScout24', active: canAccess(tier, 'premium') },
              { label: 'eBay Kleinanzeigen', active: canAccess(tier, 'premium') },
            ].map(({ label, active }) => (
              <div
                key={label}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[13px] font-medium ${
                  active
                    ? 'border-accent bg-[#E8F5EE] text-accent'
                    : 'border-[#DDDDDD] bg-white text-text-secondary'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-accent' : 'bg-[#DDDDDD]'}`} />
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade-Banner */}
      {upgradeTarget && upgradeInfo && (
        <div className="bg-accent rounded-xl px-7 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[16px] font-bold text-white mb-1">{upgradeInfo.title}</p>
            <p className="text-[13px] text-white/75">{upgradeInfo.sub}</p>
          </div>
          <Link
            href="/#preise"
            className="flex-shrink-0 inline-flex items-center justify-center rounded-pill bg-white text-accent text-[14px] font-semibold px-5 h-10 hover:bg-[#F7F7F7] transition-colors duration-150 active:scale-[0.98] whitespace-nowrap"
          >
            {upgradeInfo.cta}
          </Link>
        </div>
      )}
    </div>
  )
}
