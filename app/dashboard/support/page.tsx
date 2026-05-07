import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { canAccess, type Tier } from '@/lib/tier'
import LockedPage from '@/components/dashboard/LockedPage'
import MaklerSupportHero from '@/components/makler-support/MaklerSupportHero'
import MaklerAnfrageStatusKarte from '@/components/makler-support/MaklerAnfrageStatusKarte'
import MaklerAnfrageForm from '@/components/makler-support/MaklerAnfrageForm'

export const metadata = { title: 'Makler-Support — Dashboard' }

type Anfrage = {
  id: string
  status: string
  thema: string
  bestätigter_termin: string | null
  bestätigte_dauer_minuten: number | null
  admin_notiz: string | null
  created_at: string
}

export default async function SupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('paket_tier, vorname')
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

  const [anfrageRes, listingRes, inklusivRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('makler_anfragen')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }) as Promise<{ data: unknown[] | null }>,
    supabase
      .from('listings')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle(),
    supabase.rpc('user_hat_inklusiv_stunde_genutzt', { check_user_id: user.id }),
  ])

  const anfragen = (anfrageRes.data ?? []) as unknown as Anfrage[]
  const inklusivGenutzt = inklusivRes.data ?? false
  const listingId = listingRes.data?.id ?? null

  const showState =
    !inklusivGenutzt
      ? 'premium_inklusiv_verfügbar'
      : ('premium_zahlpflichtig' as const)

  const aktiveAnfrage = anfragen.find(
    (a) => a.status === 'neu' || a.status === 'bestätigt'
  ) ?? null

  const hatOffeneAnfrage = aktiveAnfrage?.status === 'neu'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-text-primary mb-1" style={{ letterSpacing: '-0.18px' }}>
          Makler-Support
        </h1>
        <p className="text-[14px] text-text-secondary">Dein direkter Draht zum Makler-Kollegen.</p>
      </div>

      <MaklerSupportHero showState={showState} />

      {aktiveAnfrage && (
        <MaklerAnfrageStatusKarte anfrage={aktiveAnfrage} />
      )}

      {!hatOffeneAnfrage && (
        <MaklerAnfrageForm listingId={listingId} />
      )}

      {anfragen.length > 1 && (
        <div>
          <h2 className="text-[15px] font-bold text-text-primary mb-3">Frühere Anfragen</h2>
          <div className="space-y-2">
            {anfragen.slice(1).map((a) => (
              <MaklerAnfrageStatusKarte key={a.id} anfrage={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
