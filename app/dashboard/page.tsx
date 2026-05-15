import Link from 'next/link'
import {
  Home,
  ArrowRight,
  Circle,
  Image as ImageIcon,
} from 'lucide-react'
import { normalizeFotos } from '@/lib/foto'
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
import PortalPerformance from '@/components/dashboard/PortalPerformance'
import DashboardStats from '@/components/dashboard/DashboardStats'

function formatAdresse(l: { adresse_strasse?: string | null; adresse_plz?: string | null; adresse_ort?: string | null }): string {
  const parts: string[] = []
  if (l.adresse_strasse) parts.push(l.adresse_strasse)
  const plzOrt = [l.adresse_plz, l.adresse_ort].filter(Boolean).join(' ')
  if (plzOrt) parts.push(plzOrt)
  return parts.join(', ')
}

function formatPreis(preis?: number | null): string {
  if (!preis) return '— €'
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(preis)
}

function StatusBadge({ status }: { status: string }) {
  const CONFIG: Record<string, { label: string; color: string; pulse: boolean }> = {
    aktiv:    { label: 'Live',     color: '#1B6B45', pulse: true  },
    draft:    { label: 'Entwurf',  color: '#6B7280', pulse: false },
    verkauft: { label: 'Verkauft', color: '#1B6B45', pulse: false },
  }
  const cfg = CONFIG[status] ?? { label: status, color: '#6B7280', pulse: false }
  return (
    <span
      className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium"
      style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${cfg.pulse ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: cfg.color }}
      />
      {cfg.label}
    </span>
  )
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
  const hauptfoto = listing?.fotos ? normalizeFotos(listing.fotos as unknown)[0]?.url ?? null : null
  const checkItems = checkRes.data ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileRaw = profile as any
  const wizardProgress = wizardRes.data
  const showOnboarding = !(profileRaw?.wizard_onboarding_shown ?? true)
  const bannerDismissals: number = profileRaw?.wizard_banner_dismissals ?? 0
  const tier = profile?.paket_tier as Tier

  const totalItems = CHECKLIST.flatMap((p) => p.items).length
  const completedCount = checkItems.filter((i) => i.completed).length

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
      {listing?.status === 'draft' ? (
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
      ) : !listing ? (
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
      ) : null}

      {/* Mein Objekt */}
      <div>
        {listing ? (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex flex-col sm:flex-row items-stretch">
              <div className="w-full sm:w-[200px] h-[200px] sm:h-[160px] flex-shrink-0 bg-gray-100 relative">
                {hauptfoto ? (
                  <img src={hauptfoto} alt="Hauptfoto" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon size={32} strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[18px] font-semibold text-text-primary truncate">
                      {listing.objekttyp ?? 'Mein Objekt'}
                    </h3>
                    <p className="text-[13px] text-text-secondary mt-1 truncate">
                      {formatAdresse(listing)}
                    </p>
                  </div>
                  <StatusBadge status={listing.status ?? 'draft'} />
                </div>
                <div className="flex items-end justify-between mt-3">
                  <p className="text-[22px] font-semibold text-accent">
                    {formatPreis(listing.preis)}
                  </p>
                  <Link
                    href="/dashboard/objekt"
                    className="text-[13px] font-medium text-accent hover:opacity-80"
                  >
                    Bearbeiten →
                  </Link>
                </div>
              </div>
            </div>
          </div>
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
      </div>

      {listing && (
        <DashboardStats listingId={listing.id} userId={user.id} />
      )}

      <ActivityTimeline events={recentEvents} />

      {/* Portal-Performance (nur wenn aktiv) */}
      {listing?.status === 'aktiv' && (
        <PortalPerformance listingId={listing.id} userId={user.id} />
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
