import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { canAccess, type Tier } from '@/lib/tier'
import LockedPage from '@/components/dashboard/LockedPage'
import PdfClient from './PdfClient'

export const metadata = { title: 'KI-Exposé PDF — Dashboard' }

export default async function ExposePdfPage() {
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
        featureName="KI-Exposé PDF"
        requiredTier="pro"
        description="Erstelle ein professionelles Exposé-PDF mit Fotos, Eckdaten und KI-generierten Texten — fertig zum Versenden."
        benefits={[
          'Gestaltetes PDF mit Titelbild, Eckdaten und Texten',
          'Automatisch aus deinen Objektdaten und Inserat-Texten',
          'Direkt als Download — sofort versendbar',
        ]}
        upgradePrice="599 €"
      />
    )
  }

  const { data: listing } = await supabase
    .from('listings')
    .select('objekttyp, adresse_strasse, adresse_plz, adresse_ort, wohnflaeche_qm, zimmer, preis, fotos, expose_html, expose_generiert_at')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const normalizedListing = listing
    ? {
        ...listing,
        fotos: Array.isArray(listing.fotos) ? listing.fotos : [],
      }
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-text-primary mb-1" style={{ letterSpacing: '-0.18px' }}>
          KI-Exposé PDF
        </h1>
        <p className="text-[14px] text-text-secondary">
          Gestaltetes PDF mit Titelbild, Eckdaten und KI-Texten — fertig zum Versenden an Interessenten.
        </p>
      </div>

      <PdfClient listing={normalizedListing} />
    </div>
  )
}
