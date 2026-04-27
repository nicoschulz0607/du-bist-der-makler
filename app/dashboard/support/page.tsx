import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { canAccess, type Tier } from '@/lib/tier'
import LockedPage from '@/components/dashboard/LockedPage'

export const metadata = { title: 'Makler-Support — Dashboard' }

export default async function SupportPage() {
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

  if (!canAccess(tier, 'premium')) {
    return (
      <LockedPage
        featureName="Makler-Support"
        requiredTier="premium"
        description="Direkter Draht zum erfahrenen Makler-Kollegen für komplexe Fragen — ohne Provision, ohne Vertrag."
        benefits={[
          'Direkter Draht zum Makler-Kollegen',
          'Für komplexe Verhandlungs- und Rechtsfragen',
          '1 Stunde Makler-Beratung inklusive',
        ]}
        upgradePrice="799 €"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-text-primary mb-1" style={{ letterSpacing: '-0.18px' }}>
          Makler-Support
        </h1>
        <p className="text-[14px] text-text-secondary">Dein direkter Draht zum Makler-Kollegen.</p>
      </div>
      <div className="bg-white border border-[#DDDDDD] rounded-xl p-10 flex flex-col items-center text-center">
        <p className="text-[15px] font-semibold text-text-primary mb-2">Buchung kommt in Kürze</p>
        <p className="text-[13px] text-text-secondary">Die Buchungsfunktion für deine inklusive Makler-Stunde wird gerade eingerichtet. Du wirst per E-Mail benachrichtigt.</p>
      </div>
    </div>
  )
}
