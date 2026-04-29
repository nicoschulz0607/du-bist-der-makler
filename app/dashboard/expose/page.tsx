import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { canAccess, type Tier } from '@/lib/tier'
import LockedPage from '@/components/dashboard/LockedPage'
import ExposeClient from './ExposeClient'

export const metadata = { title: 'KI-Exposé-Generator — Dashboard' }

export default async function ExposePage() {
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
        featureName="KI-Exposé-Generator"
        requiredTier="pro"
        description="Lade deine Objektdaten hoch und erhalte in 20 Sekunden ein professionelles Exposé — erstellt von KI, bearbeitbar vor dem Export."
        benefits={[
          'Professioneller Exposé-Text per KI in Sekunden',
          'Direkt aus deinen Objektdaten — kein erneutes Eingeben',
          'Alle Sektionen einzeln kopierbar',
        ]}
        upgradePrice="599 €"
      />
    )
  }

  const { data: listing } = await supabase
    .from('listings')
    .select('objekttyp, adresse_strasse, adresse_plz, adresse_ort, wohnflaeche_qm, zimmer, preis, expose_html, expose_generiert_at')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-text-primary mb-1" style={{ letterSpacing: '-0.18px' }}>
          KI-Exposé-Generator
        </h1>
        <p className="text-[14px] text-text-secondary">
          Beschreibe dein Objekt kurz — die KI schreibt ein professionelles Exposé in 20 Sekunden.
        </p>
      </div>

      <ExposeClient listing={listing ?? null} />
    </div>
  )
}
