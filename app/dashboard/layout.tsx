import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'
import FloatingBubble from '@/components/klara/FloatingBubble'
import { getKlaraContext } from '@/lib/klara/context'
import { detectTriggerSignals } from '@/lib/klara/triggers'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('vorname, paket_tier')
    .eq('id', user.id)
    .single()

  const tier = (profile?.paket_tier ?? null) as import('@/lib/tier').Tier
  const vorname = profile?.vorname ?? ''

  const klaraContext = await getKlaraContext(user.id)
  const signals = detectTriggerSignals(klaraContext)

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar tier={tier} vorname={vorname} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar vorname={vorname || 'du'} tier={tier} signals={signals} />
        <main className="flex-1 px-8 py-7 overflow-y-auto">
          {children}
        </main>
      </div>
      <FloatingBubble />
    </div>
  )
}
