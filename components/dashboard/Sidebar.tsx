'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  Home,
  FileText,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Users,
  CalendarDays,
  Handshake,
  Phone,
  Settings,
  LogOut,
  Lock,
  ChevronRight,
} from 'lucide-react'
import { canAccess, getTierLabel, type Tier } from '@/lib/tier'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  requiredTier?: 'pro' | 'premium'
  badge?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

interface SidebarProps {
  tier: Tier
  vorname: string | null
}

export default function Sidebar({ tier, vorname }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const sections: NavSection[] = [
    {
      title: 'Mein Verkauf',
      items: [
        { label: 'Übersicht', href: '/dashboard', icon: <LayoutDashboard size={16} strokeWidth={1.75} /> },
        { label: 'Schritt-für-Schritt', href: '/dashboard/schritte', icon: <CheckSquare size={16} strokeWidth={1.75} /> },
        { label: 'Mein Objekt', href: '/dashboard/objekt', icon: <Home size={16} strokeWidth={1.75} /> },
      ],
    },
    {
      title: 'KI-Tools',
      items: [
        { label: 'Inserat-Texte', href: '/dashboard/expose', icon: <FileText size={16} strokeWidth={1.75} />, requiredTier: 'pro', badge: 'Pro' },
        { label: 'KI-Exposé PDF', href: '/dashboard/expose-pdf', icon: <FileText size={16} strokeWidth={1.75} />, requiredTier: 'pro', badge: 'Pro' },
        { label: 'Preisrechner', href: '/dashboard/preisrechner', icon: <TrendingUp size={16} strokeWidth={1.75} />, requiredTier: 'pro', badge: 'Pro' },
        { label: 'Klara KI-Assistentin', href: '/dashboard/klara', icon: <Sparkles size={16} strokeWidth={1.75} /> },
      ],
    },
    {
      title: 'Interessenten',
      items: [
        { label: 'Interessenten-CRM', href: '/dashboard/interessenten', icon: <Users size={16} strokeWidth={1.75} />, requiredTier: 'pro', badge: 'Pro' },
        { label: 'Besichtigungen', href: '/dashboard/termine', icon: <CalendarDays size={16} strokeWidth={1.75} />, requiredTier: 'pro', badge: 'Pro' },
      ],
    },
    {
      title: 'Services',
      items: [
        { label: 'Partner & Services', href: '/dashboard/partner', icon: <Handshake size={16} strokeWidth={1.75} /> },
        { label: 'Makler-Support', href: '/dashboard/support', icon: <Phone size={16} strokeWidth={1.75} />, requiredTier: 'premium', badge: 'Premium' },
      ],
    },
  ]

  const initials = vorname ? vorname.charAt(0).toUpperCase() : '?'
  const tierLabel = getTierLabel(tier)

  return (
    <aside className="hidden md:flex w-60 bg-surface border-r border-[#EEEEEE] flex-col flex-shrink-0 h-screen overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#EEEEEE]">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-accent flex-shrink-0" />
          <span className="text-[14px] font-bold text-text-primary tracking-tight">du bist der makler</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider px-2 mb-1.5">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const locked = item.requiredTier ? !canAccess(tier, item.requiredTier) : false
                const isActive = item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors duration-100 ${
                        isActive
                          ? 'bg-accent-light text-accent font-semibold'
                          : locked
                          ? 'text-text-primary opacity-60 hover:bg-surface-mid'
                          : 'text-text-primary hover:bg-surface-mid'
                      }`}
                    >
                      <span className={isActive ? 'text-accent' : 'text-text-secondary'}>
                        {item.icon}
                      </span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {locked && <Lock size={12} className="text-text-tertiary flex-shrink-0" />}
                      {locked && item.badge && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          item.badge === 'Premium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#EEEEEE] px-3 py-4 space-y-1">
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-[12px] font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-text-primary truncate">{vorname ?? 'Nutzer'}</p>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              tier === 'premium'
                ? 'bg-amber-100 text-amber-700'
                : tier === 'pro'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-accent-light text-accent'
            }`}>
              {tierLabel}
            </span>
          </div>
        </div>

        <Link
          href="/dashboard/einstellungen"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-text-primary hover:bg-surface-mid transition-colors duration-100"
        >
          <Settings size={16} strokeWidth={1.75} className="text-text-secondary" />
          Einstellungen
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-text-primary hover:bg-surface-mid transition-colors duration-100"
        >
          <LogOut size={16} strokeWidth={1.75} className="text-text-secondary" />
          Ausloggen
        </button>
      </div>
    </aside>
  )
}
