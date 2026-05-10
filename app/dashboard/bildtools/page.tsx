import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Tier } from '@/lib/tier'
import BildtoolsClient from './BildtoolsClient'

type TabId = 'foto' | 'staging' | 'outdoor'

export default async function BildtoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const rawTab = String(params.tab ?? '')
  const initialTab: TabId = (['foto', 'staging', 'outdoor'] as const).includes(rawTab as TabId)
    ? (rawTab as TabId)
    : 'foto'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('paket_tier, paket_aktiviert_am')
    .eq('id', user.id)
    .single()

  const tier = (profile?.paket_tier ?? null) as Tier

  // Counter: jobs completed since paket_aktiviert_am ("in dieser Laufzeit")
  const since = profile?.paket_aktiviert_am ?? new Date(0).toISOString()
  const { data: jobRows } = await supabase
    .from('bild_jobs')
    .select('job_type')
    .eq('user_id', user.id)
    .eq('status', 'done')
    .gte('created_at', since)

  const jobs = jobRows ?? []
  const counts = {
    enhance: jobs.filter((j) => j.job_type === 'enhance').length,
    staging: jobs.filter((j) => j.job_type === 'staging').length,
    outdoor: jobs.filter((j) => j.job_type === 'outdoor').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-text-primary headline-section">KI-Bildtools</h1>
        <p className="text-[14px] text-text-secondary mt-1">
          Werte deine Immobilienfotos mit KI auf — in Sekunden.
        </p>
      </div>

      <BildtoolsClient
        tier={tier}
        userId={user.id}
        initialTab={initialTab}
        counts={counts}
      />
    </div>
  )
}
