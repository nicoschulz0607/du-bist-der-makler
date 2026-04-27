import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { canAccess, type Tier } from '@/lib/tier'
import LockedPage from '@/components/dashboard/LockedPage'

export const metadata = { title: 'Interessenten-CRM — Dashboard' }

export default async function InteressentenPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('paket_tier')
    .eq('id', user.id)
    .single()

  const tier = (profile?.paket_tier ?? null) as Tier

  if (!canAccess(tier, 'pro')) {
    return (
      <LockedPage
        featureName="Interessenten-CRM"
        requiredTier="pro"
        description="Alle Interessenten-Anfragen zentral in einer Übersicht verwalten — Status setzen, Notizen anlegen, den Überblick behalten."
        benefits={[
          'Alle Anfragen übersichtlich in einer Tabelle',
          'Status-Tracking von Neu bis Kaufinteressent',
          'Notizen und Qualifizierung pro Interessent',
        ]}
        upgradePrice="599 €"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-text-primary mb-1" style={{ letterSpacing: '-0.18px' }}>
          Interessenten-CRM
        </h1>
        <p className="text-[14px] text-text-secondary">Kommt in Kürze — wird gerade gebaut.</p>
      </div>
      <div className="bg-white border border-[#DDDDDD] rounded-xl p-10 flex flex-col items-center text-center">
        <p className="text-[15px] font-semibold text-text-primary mb-2">Feature in Entwicklung</p>
        <p className="text-[13px] text-text-secondary">Das Interessenten-CRM wird bald verfügbar sein.</p>
      </div>
    </div>
  )
}
