import Link from 'next/link'
import {
  CheckSquare,
  MessageSquare,
  FileText,
  TrendingUp,
  Users,
  Phone,
  Home,
  ArrowRight,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { canAccess, getUpgradeTarget, getUpgradeText, type Tier } from '@/lib/tier'
import { CHECKLIST } from '@/lib/checklist'
import FeatureCard from '@/components/dashboard/FeatureCard'

function differenceInDays(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileRes, listingRes, checkRes] = await Promise.all([
    supabase.from('profiles').select('vorname, paket_tier, created_at').eq('id', user.id).single(),
    supabase.from('listings').select('*').eq('user_id', user.id).order('created_at').limit(1).maybeSingle(),
    supabase.from('checkliste_status').select('aufgabe_id, completed').eq('user_id', user.id),
  ])

  const profile = profileRes.data
  const listing = listingRes.data
  const checkItems = checkRes.data ?? []
  const tier = profile?.paket_tier as Tier

  const totalItems = CHECKLIST.flatMap((p) => p.items).length
  const completedCount = checkItems.filter((i) => i.completed).length

  const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date()
  const expiresAt = new Date(createdAt.getTime() + 180 * 24 * 60 * 60 * 1000)
  const daysLeft = differenceInDays(new Date(), expiresAt)

  const upgradeInfo = getUpgradeText(tier)
  const upgradeTarget = getUpgradeTarget(tier)

  return (
    <div className="space-y-7">
      {/* Status-Banner */}
      {listing?.status === 'aktiv' ? (
        <div className="flex items-center justify-between gap-4 bg-[#E8F5EE] border border-accent rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-accent flex-shrink-0" strokeWidth={2} />
            <div>
              <p className="text-[15px] font-semibold text-accent">Dein Inserat ist live!</p>
              <p className="text-[13px] text-accent/70">Interessenten können dein Objekt jetzt finden.</p>
            </div>
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

      {/* Stats-Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl p-5">
          <p className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider mb-1">Profilaufrufe (7 Tage)</p>
          <p className="text-[28px] font-bold text-text-primary" style={{ letterSpacing: '-0.28px' }}>
            {listing?.status === 'aktiv' ? '—' : '—'}
          </p>
          <p className="text-[12px] text-text-tertiary mt-0.5">Verfügbar wenn Inserat live</p>
        </div>
        <div className="bg-surface rounded-xl p-5">
          <p className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider mb-1">Anfragen gesamt</p>
          <p className="text-[28px] font-bold text-text-primary" style={{ letterSpacing: '-0.28px' }}>0</p>
          <p className="text-[12px] text-text-tertiary mt-0.5">Noch keine Anfragen</p>
        </div>
        <div className="bg-surface rounded-xl p-5">
          <p className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider mb-1">Verbleibende Tage</p>
          <p className={`text-[28px] font-bold ${daysLeft < 30 ? 'text-[#C07000]' : 'text-text-primary'}`} style={{ letterSpacing: '-0.28px' }}>
            {daysLeft > 0 ? daysLeft : 0}
          </p>
          <p className="text-[12px] text-text-tertiary mt-0.5">von 180 Tagen Laufzeit</p>
        </div>
      </div>

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
      </div>

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

      {/* Feature-Grid */}
      <div>
        <h2 className="text-[17px] font-bold text-text-primary mb-3" style={{ letterSpacing: '-0.18px' }}>Deine Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={<CheckSquare size={20} strokeWidth={1.75} />}
            iconBg="bg-green-100 text-green-700"
            title="Schritt-für-Schritt"
            description="Geführte Checkliste durch alle Phasen des Verkaufs."
            href="/dashboard/schritte"
            requiredTier="starter"
            currentTier={tier}
          />
          <FeatureCard
            icon={<MessageSquare size={20} strokeWidth={1.75} />}
            iconBg="bg-teal-100 text-teal-700"
            title="KI-Chatbot 24/7"
            description="Antworten auf alle Fragen rund um den Immobilienverkauf."
            href="/dashboard/chatbot"
            requiredTier="starter"
            currentTier={tier}
          />
          <FeatureCard
            icon={<FileText size={20} strokeWidth={1.75} />}
            iconBg="bg-purple-100 text-purple-700"
            title="KI-Exposé-Generator"
            description="Professionelles Exposé-PDF in 20 Sekunden per KI."
            href="/dashboard/expose"
            requiredTier="pro"
            currentTier={tier}
            badge="Pro"
          />
          <FeatureCard
            icon={<TrendingUp size={20} strokeWidth={1.75} />}
            iconBg="bg-blue-100 text-blue-700"
            title="KI-Preisrechner"
            description="KI-gestützte Marktwertschätzung für deine Immobilie."
            href="/dashboard/preisrechner"
            requiredTier="pro"
            currentTier={tier}
            badge="Pro"
          />
          <FeatureCard
            icon={<Users size={20} strokeWidth={1.75} />}
            iconBg="bg-orange-100 text-orange-700"
            title="Interessenten-CRM"
            description="Alle Anfragen zentral verwalten und nachverfolgen."
            href="/dashboard/interessenten"
            requiredTier="pro"
            currentTier={tier}
            badge="Pro"
          />
          <FeatureCard
            icon={<Phone size={20} strokeWidth={1.75} />}
            iconBg="bg-rose-100 text-rose-700"
            title="Makler-Support"
            description="Direkter Draht zum Makler-Kollegen für komplexe Fragen."
            href="/dashboard/support"
            requiredTier="premium"
            currentTier={tier}
            badge="Premium"
          />
        </div>
      </div>

      {/* Upgrade-Banner */}
      {upgradeTarget && upgradeInfo && (
        <div className="bg-accent rounded-xl px-7 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[16px] font-bold text-white mb-1">{upgradeInfo.title}</p>
            <p className="text-[13px] text-white/75">{upgradeInfo.sub}</p>
          </div>
          <Link
            href={`/onboarding?upgrade=${upgradeTarget}`}
            className="flex-shrink-0 inline-flex items-center justify-center rounded-pill bg-white text-accent text-[14px] font-semibold px-5 h-10 hover:bg-[#F7F7F7] transition-colors duration-150 active:scale-[0.98] whitespace-nowrap"
          >
            {upgradeInfo.cta}
          </Link>
        </div>
      )}
    </div>
  )
}
