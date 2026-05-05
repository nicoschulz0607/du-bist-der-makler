import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { canAccess, type Tier } from '@/lib/tier'
import LockedPage from '@/components/dashboard/LockedPage'
import PreisrechnerClient from './PreisrechnerClient'

export const metadata = { title: 'KI-Preisrechner — Dashboard' }

export default async function PreisrechnerPage() {
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
        featureName="KI-Preisrechner"
        requiredTier="pro"
        description="Erhalte eine KI-gestützte Marktwertschätzung für deine Immobilie basierend auf Lage, Größe, Zustand und Baujahr."
        benefits={[
          'KI-Marktwertschätzung in Sekunden',
          'Preisspanne mit Einflussfaktoren erklärt',
          'Ergebnis gespeichert und jederzeit abrufbar',
        ]}
        upgradePrice="599 €"
      />
    )
  }

  const [{ data: listing }, { data: letzteBerechnung }] = await Promise.all([
    supabase
      .from('listings')
      .select('id, objekttyp, adresse_plz, adresse_ort, wohnflaeche_qm, zimmer, baujahr, zustand, energieausweis_klasse, grundstueck_qm, etage, fotos')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('preisschaetzungen')
      .select('modus, ergebnis, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-text-primary mb-1" style={{ letterSpacing: '-0.18px' }}>
          KI-Preisrechner
        </h1>
        <p className="text-[14px] text-text-secondary">
          KI-Marktwertschätzung basierend auf Lage, Größe, Zustand und Ausstattung.
        </p>
      </div>
      <PreisrechnerClient
        listing={listing ?? null}
        userId={user.id}
        letzteBerechnung={letzteBerechnung ?? null}
      />
    </div>
  )
}
