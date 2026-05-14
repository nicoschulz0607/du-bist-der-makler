'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Home,
  TrendingUp,
  DollarSign,
  Settings,
  ShoppingBag,
  Wrench,
  Zap,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  active: boolean
}

const NAV_ITEMS = [
  { label: 'Übersicht',    href: '/helios',           icon: <LayoutDashboard size={16} />, sprint: 1 },
  { label: 'Kunden',       href: '/helios/kunden',    icon: <Users size={16} />,           sprint: 1 },
  { label: 'Listings',     href: '/helios/listings',  icon: <Home size={16} />,            sprint: 1 },
  { label: 'Funnel',       href: '/helios/funnel',    icon: <TrendingUp size={16} />,      sprint: 3 },
  { label: 'Kosten',       href: '/helios/kosten',    icon: <DollarSign size={16} />,      sprint: 3 },
  { label: 'Operations',   href: '/helios/operations',icon: <Wrench size={16} />,          sprint: 4 },
  { label: 'Verkäufe',     href: '/helios/verkaeufe', icon: <ShoppingBag size={16} />,     sprint: 4 },
  { label: 'Einstellungen',href: '/helios/einstellungen',icon: <Settings size={16} />,    sprint: 4 },
  { label: 'Trigger-Debug',href: '/helios/trigger-debug', icon: <Zap size={16} />,         sprint: 4 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[220px] shrink-0 flex flex-col bg-helios-sidebar border-r border-white/5 overflow-y-auto">
      <div className="px-4 py-5">
        <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Admin</p>
      </div>

      <nav className="flex-1 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.sprint <= 4
            ? (item.href === '/helios' ? pathname === '/helios' : pathname.startsWith(item.href))
            : false
          const isEnabled = item.sprint <= 4

          if (!isEnabled) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/20 cursor-not-allowed"
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
                <span className="ml-auto text-[10px] text-white/20">bald</span>
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-helios-accent text-white'
                  : 'text-white/60 hover:text-white hover:bg-helios-sidebar-hover'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/5">
        <p className="text-[10px] text-white/20">HELIOS · dubistdermakler.de</p>
      </div>
    </aside>
  )
}
