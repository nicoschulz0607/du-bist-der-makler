interface HeaderProps {
  adminEmail: string
}

async function signOutAction() {
  'use server'
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  await supabase.auth.signOut()
  const { redirect } = await import('next/navigation')
  redirect('/login')
}

export function Header({ adminEmail }: HeaderProps) {
  const initial = adminEmail[0].toUpperCase()

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-helios-border bg-helios-bg shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-helios-accent tracking-wide">HELIOS</span>
        <span className="text-helios-border text-sm">·</span>
        <span className="text-xs text-helios-text-muted">dubistdermakler.de</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-helios-accent flex items-center justify-center text-white text-xs font-semibold">
            {initial}
          </div>
          <span className="text-xs text-helios-text-muted hidden sm:block">{adminEmail}</span>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="text-xs text-helios-text-muted hover:text-helios-text transition-colors px-2 py-1 rounded hover:bg-helios-surface-muted"
          >
            Abmelden
          </button>
        </form>
      </div>
    </header>
  )
}
