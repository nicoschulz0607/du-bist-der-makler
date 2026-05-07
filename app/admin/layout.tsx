import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/isAdmin'

export const metadata = { title: 'Admin — du bist der makler' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email)) redirect('/login')

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="bg-white border-b border-[#EEEEEE] px-6 py-4 flex items-center gap-3">
        <span className="text-[17px] font-bold text-text-primary" style={{ letterSpacing: '-0.2px' }}>
          du bist der makler
        </span>
        <span className="text-[11px] font-semibold bg-[#1B6B45] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
          Admin
        </span>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
