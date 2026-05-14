import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/helios/auth'
import { isLiveMode } from '@/lib/helios/stripeMode'
import { Sidebar } from '@/lib/helios/components/layout/Sidebar'
import { Header } from '@/lib/helios/components/layout/Header'

export const metadata: Metadata = {
  title: 'HELIOS — Admin',
  robots: { index: false, follow: false },
}

export default async function HeliosLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/helios')
  }

  await requireAdmin(user.email)

  return (
    <div className="flex h-screen overflow-hidden bg-helios-bg">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header adminEmail={user.email!} />
        {isLiveMode() ? (
          <div className="bg-helios-danger text-white text-xs font-semibold text-center py-1.5 shrink-0">
            ⚠️ LIVE-MODE — echte Zahlungen
          </div>
        ) : (
          <div className="bg-helios-info/20 text-helios-info text-xs font-medium text-center py-1 shrink-0">
            Test-Mode
          </div>
        )}
        <main className="flex-1 overflow-y-auto bg-helios-bg">
          {children}
        </main>
      </div>
    </div>
  )
}
